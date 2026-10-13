"""
Creates a test user so the login screen has something to authenticate against.

    python manage.py seed_user --email admin@dss.local --password 'DevPass123'

Idempotent: updates the password and role if the user already exists, so you can
re-run it after changing the seed password.
"""

import argparse

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction

from accounts.models import Role


class Command(BaseCommand):
    help = "Create or update a test user for local login testing."

    def add_arguments(self, parser):
        parser.add_argument("--email", required=True)
        parser.add_argument("--password", required=True)
        parser.add_argument(
            "--role",
            default=Role.ANALYST,
            choices=[r.value for r in Role],
        )
        parser.add_argument("--full-name", default="Dev Tester")
        parser.add_argument("--organisation", default="DSS Test Org")

    @transaction.atomic
    def handle(self, *args, **options):
        User = get_user_model()
        email = options["email"].strip().lower()
        full_name = options["full_name"]

        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                "username": email,
                "full_name": full_name,
                "organisation": options["organisation"],
                "role": options["role"],
                "is_active": True,
            },
        )

        user.set_password(options["password"])
        user.full_name = full_name
        user.organisation = options["organisation"]
        user.role = options["role"]
        user.is_active = True
        # USERNAME_FIELD is email, so `username` is vestigial but the column is
        # NOT NULL and unique.
        user.username = email
        user.save()

        verb = "Created" if created else "Updated"
        self.stdout.write(
            self.style.SUCCESS(
                f"{verb} {email} (role={user.role}) — password set from --password"
            )
        )