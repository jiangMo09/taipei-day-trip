from fastapi import APIRouter, Request
from utils.logger_api import setup_logger
from dotenv import load_dotenv
from datetime import date
from pydantic import BaseModel
import os
import json
import mysql.connector
from utils.get_jwt_payload import get_jwt_payload
from utils.mysql import get_db_connection, execute_query

load_dotenv()
secret_key = os.getenv("JWT_SECRET_KEY")

router = APIRouter()
logger = setup_logger("api.booking", "app.log")


class Booking(BaseModel):
    attractionId: int
    date: date
    time: str
    price: int


@router.post("/booking")
async def create_booking(request: Request, booking: Booking):
    auth_token = request.headers.get("authToken")

    payload = get_jwt_payload(auth_token)
    if not payload:
        return {"error": True, "message": "未登入系統，拒絕存取"}

    if not (booking.time == "morning" or booking.time_of_day == "afternoon"):
        return {"error": True, "message": "旅程只有早上或是下午"}

    today = date.today()
    if booking.date <= today:
        return {"error": True, "message": "訂單日期必須是未來的日期"}

    connection = None
    try:
        connection = get_db_connection()
        query = "SELECT * FROM ATTRACTIONS WHERE id = %s"
        existing_attractions = execute_query(
            connection, query, (booking.attractionId,), fetch_method="fetchone"
        )
        if not existing_attractions:
            return {"error": True, "message": "查無此景點"}

        query = "INSERT INTO BOOKING (attraction_id, user_id, time_of_day, date, price) VALUES (%s, %s, %s, %s, %s)"
        execute_query(
            connection,
            query,
            (
                booking.attractionId,
                payload["id"],
                booking.time,
                booking.date,
                booking.price,
            ),
        )
        return {"ok": True}
    except mysql.connector.Error as err:
        logger.error("伺服器內部錯誤:%s", err)
        return {"error": True, "message": str(err)}
    finally:
        if connection:
            connection.close()
