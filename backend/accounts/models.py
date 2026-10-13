"""
User model.

Two deviations from Django's default, both deliberate:

1. `role` carries the four DSS roles verbatim as they appear in the UI. They
   are not renamed or normalised, so the strings in the register form and in
   the Next.js permission map stay in sync with this.
2. `email` is unique and is the login identifier, so `USERNAME_FIELD` points at
   it rather than a username.
"""

from django.contrib.auth.models import AbstractUser
from django.db import models


class Role(models.TextChoices):
    ANALYST = "Analyst", "Analyst"
    DECISION_MAKER = "Decision Maker", "Decision Maker"
    ADMINISTRATOR = "Administrator", "Administrator"
    AUDITOR = "Auditor", "Auditor"


class User(AbstractUser):
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=255, blank=True)
    organisation = models.CharField(max_length=255, blank=True)
    role = models.CharField(max_length=32, choices=Role.choices, default=Role.ANALYST)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    class Meta:
        db_table = "accounts_user"

    def __str__(self) -> str:
        return self.email