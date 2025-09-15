from django.contrib.auth import get_user_model
from django.contrib.auth.backends import ModelBackend

User = get_user_model()


class EmailBackend(ModelBackend):
    """
    Custom authentication backend that allows users
    to log in using their email address.
    """

    def authenticate(self, request, username=None, password=None, **kwargs):
        # Try to get the email from kwargs first, then fall back to username
        email = kwargs.get("email", username)

        if email is None or password is None:
            return None

        try:
            # Look up user by email instead of username
            user = User.objects.get(email=email)
            print(f"Found user: {user.email}")  # Debug print
        except User.DoesNotExist:
            print(f"No user found with email: {email}")  # Debug print
            # Run the default password hasher once to reduce the timing
            # difference between an existing and a non-existing user
            User().set_password(password)
            return None
        else:
            # Check if the password is correct
            if user.check_password(password):
                if self.user_can_authenticate(user):
                    return user
                else:
                    print(
                        f"User cannot authenticate: {user.email}"
                    )  # Debug print
            else:
                print(
                    f"Password incorrect for user: {user.email}"
                )  # Debug print

        return None

    def get_user(self, user_id):
        """
        Get user by ID (required method for authentication backends)
        """
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None
