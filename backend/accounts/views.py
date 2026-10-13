"""
Auth endpoints for the login round-trip test.

Contract with Next.js:

Every endpoint requires the shared secret in `X-Internal-Token`. These views are
CSRF-exempt because the caller is the Next.js server, not a browser form; the
header is what makes that exemption safe, so it is checked first.

  POST /api/v1/auth/login  { email, password }
      200 -> { token, user }
      400 -> { error: "validation", fields: { email?: str, password?: str } }
      401 -> { error: "invalid_credentials" }   (identical for unknown email and
            wrong password, so responses can't be used to enumerate accounts)
      403 -> { error: "forbidden" }             (missing or wrong shared secret)
      429 -> { error: "rate_limited", retryAfter: int }

  GET  /api/v1/auth/me     Authorization: Bearer <token>
      200 -> { user }
      401 -> { error: "unauthenticated" }

  POST /api/v1/auth/logout
      204

`token` is an opaque Django session key. Next.js stores it in an httpOnly
cookie and forwards it, so the session lives server-side in Postgres and the
browser never holds anything it could tamper with.
"""

import hmac
import json
import re
from functools import wraps

from django.conf import settings
from django.contrib.auth import authenticate
from django.contrib.auth import get_user_model
from django.contrib.sessions.backends.db import SessionStore
from django.contrib.auth import login as django_login
from django.contrib.auth import logout as django_logout
from django.core.cache import cache
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

User = get_user_model()

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]{2,}$")

# Login throttle. Counted per (IP, email) so one attacker can't lock out an
# unrelated user by hammering their address from elsewhere.
LOGIN_MAX_ATTEMPTS = 10
LOGIN_WINDOW_SECONDS = 15 * 60


def require_internal_token(view):
    """Rejects anything that doesn't present the shared secret.

    Without this the auth endpoints are an open, CSRF-exempt credential-testing
    oracle for anyone who can reach the host.
    """

    @wraps(view)
    def wrapper(request, *args, **kwargs):
        presented = request.META.get("HTTP_X_INTERNAL_TOKEN", "")
        expected = settings.INTERNAL_API_TOKEN
        # compare_digest to keep the comparison constant-time.
        if not expected or not hmac.compare_digest(presented, expected):
            return JsonResponse({"error": "forbidden"}, status=403)
        return view(request, *args, **kwargs)

    return wrapper


def client_ip(request) -> str:
    forwarded = request.META.get("HTTP_X_FORWARDED_FOR", "")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR", "unknown")


def throttle_key(request, email: str) -> str:
    return f"login-attempts:{client_ip(request)}:{email}"


def register_failure(key: str) -> None:
    # add() is a no-op when the key exists, so the window starts at the first
    # failure and is not extended by later ones.
    cache.add(key, 0, LOGIN_WINDOW_SECONDS)
    try:
        cache.incr(key)
    except ValueError:
        # Expired between the add and the incr; the next failure restarts it.
        pass


def user_payload(user: User) -> dict:
    """Only what the UI needs. Never leak the password hash or permissions."""
    return {
        "id": user.pk,
        "email": user.email,
        "fullName": user.full_name or user.get_full_name() or user.email,
        "organisation": user.organisation,
        "role": user.role,
        "isActive": user.is_active,
    }


def read_body(request) -> dict:
    """Accepts JSON or form encoding; Next.js sends JSON."""
    content_type = request.content_type or ""
    if content_type.startswith("application/x-www-form-urlencoded"):
        return request.POST.dict()
    try:
        body = json.loads(request.body or b"{}")
    except ValueError:
        return {}
    return body if isinstance(body, dict) else {}


def resolve_bearer(request):
    """Maps `Authorization: Bearer <session_key>` onto request.user.

    Returns None when the header is missing or the session has expired, so the
    caller can decide the response shape.
    """
    header = request.META.get("HTTP_AUTHORIZATION", "")
    if not header.startswith("Bearer "):
        return None

    session_key = header.removeprefix("Bearer ").strip()
    if not session_key:
        return None

    store = SessionStore(session_key=session_key)
    user_id = store.get("_auth_user_id")
    if not user_id:
        return None

    user = User.objects.filter(pk=user_id).first()
    if user is None or not user.is_active:
        return None

    request.user = user
    request.session = store
    return user


@csrf_exempt
@require_internal_token
@require_http_methods(["POST"])
def login_view(request):
    data = read_body(request)

    email = str(data.get("email", "")).strip().lower()
    password = str(data.get("password", ""))

    key = throttle_key(request, email)
    if (cache.get(key) or 0) >= LOGIN_MAX_ATTEMPTS:
        return JsonResponse(
            {"error": "rate_limited", "retryAfter": LOGIN_WINDOW_SECONDS},
            status=429,
            headers={"Retry-After": str(LOGIN_WINDOW_SECONDS)},
        )

    fields = {}
    if not email:
        fields["email"] = "Work email is required."
    elif not EMAIL_RE.match(email):
        fields["email"] = "Enter a valid email address, e.g. name@organisation.org."
    if not password:
        fields["password"] = "Password is required."

    if fields:
        return JsonResponse({"error": "validation", "fields": fields}, status=400)

    user = authenticate(request, username=email, password=password)

    if user is None:
        # Identical response for unknown-email and wrong-password.
        register_failure(key)
        return JsonResponse({"error": "invalid_credentials"}, status=401)

    if not user.is_active:
        register_failure(key)
        return JsonResponse({"error": "account_disabled"}, status=403)

    cache.delete(key)  # a success clears the counter
    django_login(request, user)
    return JsonResponse(
        {"token": request.session.session_key, "user": user_payload(user)},
        status=200,
    )


@require_internal_token
@require_http_methods(["GET", "POST"])
def me_view(request):
    if resolve_bearer(request) is None:
        return JsonResponse({"error": "unauthenticated"}, status=401)
    return JsonResponse({"user": user_payload(request.user)}, status=200)


@csrf_exempt
@require_internal_token
@require_http_methods(["POST"])
def logout_view(request):
    resolve_bearer(request)
    django_logout(request)
    # 204 means "no content", so it must not carry a body.
    return HttpResponse(status=204)