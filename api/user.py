from fastapi import APIRouter
from pydantic import BaseModel, field_validator, EmailStr
import mysql.connector
from utils.mysql import get_db_connection, execute_query
from passlib.context import CryptContext

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
