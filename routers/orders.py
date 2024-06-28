from datetime import date
from typing import Any, Dict, List, Optional
import random

from fastapi import APIRouter, Request, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr
import jwt
import mysql.connector

from utils.logger_api import setup_logger
from utils.mysql import get_db_connection, execute_query
from utils.load_env import JWT_SECRET_KEY

router = APIRouter()
logger = setup_logger("api.orders", "app.log")


class Order(BaseModel):
    prime: str
    name: str
    email: EmailStr
    phone: str


@router.post("/orders")
async def process_payment(request: Request, order: Order):
    auth_token = request.headers.get("authToken")

    payload = jwt.decode(auth_token, JWT_SECRET_KEY, algorithms=["HS256"])
    if not payload:
        return JSONResponse(
            status_code=status.HTTP_403_FORBIDDEN,
            content={"error": True, "message": "未登入系統，拒絕存取"},
        )

    print("orderorder", order)
    return None
