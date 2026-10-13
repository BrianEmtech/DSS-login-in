"""
Django settings for the DSS backend.

Scope note: this is the testing slice. Login, identity, and role lookup only.
OAuth, OTP, and password reset are deliberately not wired yet.
"""

import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent

# Loads ../.env if present, without clobbering real environment variables.
load_dotenv(BASE_DIR.parent / ".env")


def env_bool(name: str, default: bool = False) -> bool:
    return os.getenv(name, str(int(default))).lower() in {"1", "true", "yes", "on"}


SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "dev-only-insecure-change-me")
DEBUG = env_bool("DJANGO_DEBUG", True)
ALLOWED_HOSTS = [
    h.strip() for h in os.getenv("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")
]

INSTALLED_APPS = [
    "django.contrib.auth",
    "django.contrib.contenttypes",
    # Required even though nothing here renders a session-backed page. The
    # login endpoint hands Next.js an opaque session key, and the db backend
    # resolves its model lazily — so leaving this out still passes
    # `manage.py check` and only fails at request time, inside django_login().
    "django.contrib.sessions",
    "accounts",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
]

ROOT_URLCONF = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"

# Must point at the custom model before any migration runs. Without it Django
# registers auth.User as well, and the two clash on the Group/Permission
# reverse accessors.
AUTH_USER_MODEL = "accounts.User"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {"context_processors": []},
    },
]

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.getenv("POSTGRES_DB", "dss"),
        "USER": os.getenv("POSTGRES_USER", "dss"),
        "PASSWORD": os.getenv("POSTGRES_PASSWORD", "dss"),
        "HOST": os.getenv("POSTGRES_HOST", "localhost"),
        "PORT": os.getenv("POSTGRES_PORT", "5432"),
        "CONN_MAX_AGE": 60,
        # Without this, any management command blocks for the OS default when
        # Postgres isn't running — `makemigrations` just hangs with no output.
        # 3s makes it report the real error instead.
        "OPTIONS": {"connect_timeout": 3},
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
     "OPTIONS": {"min_length": 8}},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-gb"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True
STATIC_URL = "static/"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# --- Email ---------------------------------------------------------------
# Everything lands in the Mailpit web UI at http://localhost:8025.
EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = os.getenv("EMAIL_HOST", "localhost")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", "1025"))
EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER", "")
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD", "")
EMAIL_USE_TLS = env_bool("EMAIL_USE_TLS", False)
DEFAULT_FROM_EMAIL = os.getenv("DEFAULT_FROM_EMAIL", "no-reply@dss.local")

# --- API ----------------------------------------------------------------
# Next.js calls this server-side with the shared secret, so CSRF exemption is
# limited to the auth endpoints and justified by that header rather than by
# blanket trust. See accounts/views.py.
INTERNAL_API_TOKEN = os.getenv("INTERNAL_API_TOKEN", "dev-only-insecure-change-me")