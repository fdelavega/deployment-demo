# -*- coding: utf-8 -*-

# Copyright (c) 2013 CoNWeT Lab., Universidad Politécnica de Madrid
# Copyright (c) 2023 Future Internet Consulting and Development Solutions S.L.

# This file belongs to the business-charging-backend
# of the Business API Ecosystem.

# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as
# published by the Free Software Foundation, either version 3 of the
# License, or (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.

from os import environ, path
from services_settings import *

DEBUG = True
TEMPLATE_DEBUG = DEBUG

ALLOWED_HOSTS = ["*"]

ADMINS = (
    # ('Your Name', 'your_email@example.com'),
)

MANAGERS = ADMINS

DATABASES = {
    "default": {
        "ENGINE": "djongo",
        "NAME": "wstore_db",
        "ENFORCE_SCHEMA": False,
        "CLIENT": {
            "host": "mongo",
            #'username': 'mongoadmin',
            #'password': 'mongopass'
        },
    }
}

BASEDIR = path.dirname(path.abspath(__file__))

DATA_UPLOAD_MAX_MEMORY_SIZE = 52428800

STORE_NAME = "WStore"
AUTH_PROFILE_MODULE = "wstore.models.UserProfile"

ADMIN_ROLE = "admin"
PROVIDER_ROLE = "seller"
CUSTOMER_ROLE = "customer"

LOGGING = {
    "version": 1,
    "disable_existing-loggers": False,
    "formatters": {
        "verbose": {
            "format": "{levelname: <8} [{asctime}]: ({module}) {message}",
            "style": "{",
        }
    },
    "handlers": {
        "console": {
            "level": "DEBUG" if DEBUG else "INFO",
            "class": "logging.StreamHandler",
            "formatter": "verbose",
        },
        # "file": {
        #     "level": "DEBUG" if DEBUG else "INFO",
        #     "class": "logging.FileHandler",
        #     "filename": "logging/debug.log",
        #     "formatter": "verbose",
        # },
    },
    "loggers": {
        "django.request": {
            "handlers": ["console"],
            "propagate": True,
            "level": "DEBUG",
        },
        "wstore.default_logger": {
            "handlers": ["console"],
            "propagate": True,
            "level": "DEBUG",
        },
    },
}

CHARGE_PERIODS = {
    "day": 1,  # One day
    "week": 7,  # One week
    "month": 30,  # One month
    "quarter": 90,  # Three months
    "year": 365,  # One year
    "quinquennial": 1825,  # Five years
}

CURRENCY_CODES = [
    ("AUD", "Australia Dollar"),
    ("BRL", "Brazil Real"),
    ("CAD", "Canada Dollar"),
    ("CHF", "Switzerland Franc"),
    ("CZK", "Czech Republic Koruna"),
    ("DKK", "Denmark Krone"),
    ("EUR", "Euro"),
    ("GBP", "United Kingdom Pound"),
    ("HKD", "Hong Kong Dollar"),
    ("HUF", "Hungary Forint"),
    ("ILS", "Israel Shekel"),
    ("JPY", "Japan Yen"),
    ("MXN", "Mexico Peso"),
    ("MYR", "Malaysia Ringgit"),
    ("NOK", "Norway Krone"),
    ("NZD", "New Zealand Dollar"),
    ("PHP", "Philippines Peso"),
    ("PLN", "Poland Zloty"),
    ("RUB", "Russia Ruble"),
    ("SEK", "Sweden Krona"),
    ("SGD", "Singapore Dollar"),
    ("THB", "Thailand Baht"),
    ("TRY", "Turkey Lira"),
    ("TWD", "Taiwan New Dollar"),
    ("USD", "US Dollar"),
]

# Absolute filesystem path to the directory that will hold user-uploaded files.
MEDIA_DIR = "media/"
MEDIA_ROOT = path.join(BASEDIR, MEDIA_DIR)
BILL_ROOT = path.join(MEDIA_ROOT, "bills")

# URL that handles the media served from MEDIA_ROOT.
MEDIA_URL = "/charging/media/"

INSTALLED_APPS = [
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    # 'django.contrib.messages',
    # 'django.contrib.admin',
    # 'wstore.store_commons',
    "wstore",
    # 'wstore.charging_engine',
    # 'django_crontab',
    # 'django_nose'
]

# Make this unique, and don't share it with anybody.
SECRET_KEY = "8p509oqr^68+z)y48_*pv!ceun)gu7)yw6%y9j2^0=o14)jetr"

TEMPLATE_CONTEXT_PROCESSORS = (
    "django.contrib.auth.context_processors.auth",
    "django.core.context_processors.debug",
    "django.core.context_processors.i18n",
    "django.core.context_processors.media",
    "django.core.context_processors.request",
    "django.core.context_processors.static",
)

# List of callables that know how to import templates from various sources.
TEMPLATE_LOADERS = (
    "django.template.loaders.filesystem.Loader",
    "django.template.loaders.app_directories.Loader",
)

# WSTOREMAILUSER = "no.reply.dome.sbx"
# WSTOREMAIL = "no.reply.dome.sbx@gmail.com"
# WSTOREMAILPASS = "pwde yccq cewe xfrd"
# SMTPSERVER = "smtp.gmail.com"
SMTPPORT = 587

WSTOREMAILUSER = "customer-service@dome-marketplace.eu"
WSTOREMAIL = "noreply-customer-service@dome-marketplace.eu"
WSTOREMAILPASS = "Dome@2023"
SMTPSERVER = "smtp.ionos.de"


MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "wstore.store_commons.middleware.AuthenticationMiddleware",
]

ROOT_URLCONF = "urls"

# Python dotted path to the WSGI application used by Django's runserver.
WSGI_APPLICATION = "wsgi.application"

# Payment method determines the payment gateway to be used
# Allowed values: paypal (default), stripe, None
PAYMENT_METHOD = "dpas"

AUTHENTICATION_BACKENDS = ("django.contrib.auth.backends.ModelBackend",)

TEST_RUNNER = "django_nose.NoseTestSuiteRunner"

# Daily job that checks pending pay-per-use charges
CRONJOBS = [
    ("0 5 * * *", "django.core.management.call_command", ["pending_charges_daemon"]),
    ("0 6 * * *", "django.core.management.call_command", ["resend_cdrs"]),
    ("0 4 * * *", "django.core.management.call_command", ["resend_upgrade"]),
]

CLIENTS = {
    "paypal": "wstore.charging_engine.payment_client.paypal_client.PayPalClient",
    "stripe": "wstore.charging_engine.payment_client.stripe_client.StripeClient",
    "dpas": "wstore.charging_engine.payment_client.dpas_client.DpasClient",
    None: "wstore.charging_engine.payment_client.payment_client.PaymentClient",
}

NOTIF_CERT_FILE = None
NOTIF_CERT_KEY_FILE = None

PROPAGATE_TOKEN = True

DEFAULT_AUTO_FIELD = "django.db.models.AutoField"

# =====================================
# ENVIRONMENT SETTINGS
# =====================================

DATABASES["default"]["NAME"] = environ.get("BAE_CB_MONGO_DB", DATABASES["default"]["NAME"])

env_user = environ.get("BAE_CB_MONGO_USER", None)
if env_user is not None:
    DATABASES["default"]["CLIENT"]["username"] = env_user
    DATABASES["default"]["CLIENT"]["authSource"] = DATABASES["default"]["NAME"]

env_pass = environ.get("BAE_CB_MONGO_PASS", None)
if env_pass is not None:
    DATABASES["default"]["CLIENT"]["password"] = env_pass

env_host = environ.get("BAE_CB_MONGO_SERVER", None)
if env_host is not None:
    DATABASES["default"]["CLIENT"]["host"] = env_host

env_port = environ.get("BAE_CB_MONGO_PORT", None)
if env_port is not None:
    DATABASES["default"]["CLIENT"]["port"] = int(env_port)


DATA_UPLOAD_MAX_MEMORY_SIZE = int(environ.get("BAE_CB_MAX_UPLOAD_SIZE", DATA_UPLOAD_MAX_MEMORY_SIZE))

ADMIN_ROLE = environ.get("BAE_LP_OAUTH2_ADMIN_ROLE", ADMIN_ROLE)
PROVIDER_ROLE = environ.get("BAE_LP_OAUTH2_SELLER_ROLE", PROVIDER_ROLE)
CUSTOMER_ROLE = environ.get("BAE_LP_OAUTH2_CUSTOMER_ROLE", CUSTOMER_ROLE)

WSTOREMAILUSER = environ.get("BAE_CB_EMAIL_USER", WSTOREMAILUSER)
WSTOREMAIL = environ.get("BAE_CB_EMAIL", WSTOREMAIL)
WSTOREMAILPASS = environ.get("BAE_CB_EMAIL_PASS", WSTOREMAILPASS)
SMTPSERVER = environ.get("BAE_CB_EMAIL_SMTP_SERVER", SMTPSERVER)
SMTPPORT = environ.get("BAE_CB_EMAIL_SMTP_PORT", SMTPPORT)

PAYMENT_METHOD = environ.get("BAE_CB_PAYMENT_METHOD", PAYMENT_METHOD)

if PAYMENT_METHOD == "None":
    PAYMENT_METHOD = None

VERIFY_REQUESTS = environ.get("BAE_CB_VERIFY_REQUESTS", VERIFY_REQUESTS)
if isinstance(VERIFY_REQUESTS, str):
    VERIFY_REQUESTS = VERIFY_REQUESTS == "True"

SITE = environ.get("BAE_SERVICE_HOST", SITE)
LOCAL_SITE = environ.get("BAE_CB_LOCAL_SITE", LOCAL_SITE)

CATALOG = environ.get("BAE_CB_CATALOG", CATALOG)
PARTY = environ.get("BAE_CB_PARTY", PARTY)
RESOURCE_CATALOG = environ.get("BAE_CB_RESOURCE_CATALOG", RESOURCE_CATALOG)
SERVICE_CATALOG = environ.get("BAE_CB_SERVICE_CATALOG", SERVICE_CATALOG)

INVENTORY = environ.get("BAE_CB_INVENTORY", INVENTORY)
RESOURCE_INVENTORY = environ.get("BAE_CB_RESOURCE_INVENTORY", RESOURCE_INVENTORY)
SERVICE_INVENTORY = environ.get("BAE_CB_SERVICE_INVENTORY", SERVICE_INVENTORY)

DOME_BILLING_URL = environ.get("BAE_CB_DOME_BILLING_URL", DOME_BILLING_URL)

ORDERING = environ.get("BAE_CB_ORDERING", ORDERING)

BILLING = environ.get("BAE_CB_CUSTOMER_BILL", BILLING)
ACCOUNT = environ.get("BAE_CB_BILLING", ACCOUNT)

USAGE = environ.get("BAE_CB_USAGE", USAGE)
AUTHORIZE_SERVICE = environ.get("BAE_CB_AUTHORIZE_SERVICE", AUTHORIZE_SERVICE)

PAYMENT_CLIENT = CLIENTS[PAYMENT_METHOD]

PROPAGATE_TOKEN = environ.get("BAE_CB_PROPAGATE_TOKEN", PROPAGATE_TOKEN)
if isinstance(PROPAGATE_TOKEN, str):
    PROPAGATE_TOKEN = PROPAGATE_TOKEN == "True"

AWS_ACCESS_KEY_ID = environ.get("AWS_ACCESS_KEY_ID", "")
AWS_SECRET_ACCESS_KEY = environ.get("AWS_SECRET_ACCESS_KEY", "")
BUCKET_NAME = environ.get("BUCKET_NAME", "")

ACL_ENABLED = environ.get("ACL_ENABLED", False)
if isinstance(ACL_ENABLED, str):
    ACL_ENABLED = ACL_ENABLED == "True"

AWS_ENABLED = environ.get("AWS_ENABLED", False)
if isinstance(AWS_ENABLED, str):
    AWS_ENABLED = AWS_ENABLED == "True"


BILLING_ENGINE = 'local'
