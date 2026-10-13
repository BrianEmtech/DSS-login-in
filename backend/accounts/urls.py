from django.urls import path

from . import views

urlpatterns = [
    path("auth/login", views.login_view, name="login"),
    path("auth/me", views.me_view, name="me"),
    path("auth/logout", views.logout_view, name="logout"),
]