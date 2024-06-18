import datetime
import jwt
import secrets
from fastapi import APIRouter
from pydantic import BaseModel, field_validator, EmailStr
import mysql.connector
from utils.mysql import get_db_connection, execute_query
from passlib.context import CryptContext


secret_key = secrets.token_bytes(32)

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class UserSignup(BaseModel):
    name: str
    email: EmailStr
    password: str

    @field_validator("name")
    def name_must_not_be_empty(cls, v):
        if not v.strip():
            raise ValueError("名字不能為空")
        return v

    @field_validator("email")
    def email_must_not_be_empty(cls, v):
        if not v:
            raise ValueError("請輸入有效的電子郵件地址")
        return v

    @field_validator("password")
    def password_must_not_be_empty(cls, v):
        if not v.strip():
            raise ValueError("密碼不能為空")
        return v


@router.post("/user")
async def signup(user: UserSignup):
    connection = None
    try:
        connection = get_db_connection()
        query = "SELECT * FROM user WHERE email = %s"
        existing_user = execute_query(
            connection, query, (user.email,), fetch_method="fetchone"
        )
        if existing_user:
            return {"error": True, "message": "電子郵件已經註冊"}
        hashed_password = pwd_context.hash(user.password)
        query = "INSERT INTO user (name, email, password) VALUES (%s, %s, %s)"
        execute_query(connection, query, (user.name, user.email, hashed_password))
        return {"ok": True}
    except mysql.connector.Error as err:
        return {"error": True, "message": str(err)}
    finally:
        if connection:
            connection.close()


class UserLogin(BaseModel):
    email: EmailStr
    password: str


@router.put("/user/auth")
async def authenticate_user(user: UserLogin):
    connection = None

    if not user.email or not user.password:
        return {"error": True, "message": "請輸入帳密"}

    try:
        connection = get_db_connection()
        query = "SELECT id, name, password FROM user WHERE email = %s"
        result = execute_query(connection, query, (user.email,))
        if not result:
            return {"error": True, "message": "電子郵件尚未註冊"}

        if not pwd_context.verify(user.password, result["password"]):
            return {"error": True, "message": "密碼錯誤"}

        expiration_time = datetime.datetime.utcnow() + datetime.timedelta(days=7)
        payload = {
            "id": result["id"],
            "name": result["name"],
            "email": user.email,
            "exp": expiration_time,
        }
        jwt_token = jwt.encode(payload, secret_key, algorithm="HS256")
        return {"token": jwt_token}
    except mysql.connector.Error as err:
        return {"error": True, "message": str(err)}
    finally:
        if connection:
            connection.close()
