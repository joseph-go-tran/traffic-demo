import sentry_sdk
from sentry_sdk.integrations.django import DjangoIntegration

from .base import *

ALLOWED_HOSTS = ["localhost", "127.0.0.1", "joseph.works"]

DEBUG = os.getenv("DEBUG", False)

STATIC_ROOT = os.path.join(BASE_DIR, "static")

# Database
# https://docs.djangoproject.com/en/2.0/ref/settings/#databases

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.getenv("DB_NAME", "prod_db"),
        "USER": os.getenv("DB_USER", "postgres"),
        "PASSWORD": os.getenv("DB_PASSWORD", ""),
        "HOST": os.getenv("DB_HOST", "127.0.0.1"),
        "PORT": os.getenv("DB_PORT", "5432"),
    }
}

# Sentry
sentry_sdk.init(
    dsn=os.getenv("SENTRY_DNS"),
    enable_tracing=True,
    integrations=[
        DjangoIntegration(
            transaction_style="url",
            middleware_spans=True,
            signals_spans=False,
            cache_spans=False,
        ),
    ],
)

# Logging
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "standard": {
            "format": "[%(asctime)s] %(levelname)s [%(name)s:%(lineno)s] %(message)s",
            "datefmt": "%d/%b/%Y %H:%M:%S",
        },
    },
    "filters": {
        "require_debug_false": {"()": "django.utils.log.RequireDebugFalse"}
    },
    "handlers": {
        "console": {
            "level": "INFO",
            "class": "logging.StreamHandler",
            "formatter": "standard",
        },
    },
    "loggers": {
        "django": {
            "handlers": ["console"],
            "propagate": True,
            "level": "INFO",
        },
    },
}

# Production CORS settings - more restrictive
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOW_CREDENTIALS = True

# Production allowed origins - add your production domains here
CORS_ALLOWED_ORIGINS = [
    "https://joseph.works",
    "https://www.joseph.works",
    # Add your production frontend URLs here
]

# You can also use environment variables for production CORS origins
CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^https://.*\.joseph\.works$",
]
