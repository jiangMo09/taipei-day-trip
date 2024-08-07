from dotenv import load_dotenv
import os

load_dotenv()

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
MY_IPS = os.getenv("MY_IPS")
HOST = os.getenv("DB_HOST")
USER = os.getenv("DB_USER")
PASSWORD = os.getenv("DB_PASSWORD")
NAME = os.getenv("DB_NAME")
TAPPAY_MERCHANT_ID = os.getenv("TAPPAY_MERCHANT_ID")
TAPPAY_PARTNER_KEY = os.getenv("TAPPAY_PARTNER_KEY")
SQS_URL = os.getenv("SQS_URL")
REDIS_URL = os.getenv("REDIS_URL")
