from fastapi import APIRouter, Request, status
from pydantic import BaseModel
from datetime import date
import mysql.connector
import jwt
from fastapi.responses import JSONResponse
from utils.logger_api import setup_logger
from utils.mysql import get_db_connection, execute_query
from dotenv import load_dotenv
import os

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

    payload = jwt.decode(auth_token, secret_key, algorithms=["HS256"])
    if not payload:
        return JSONResponse(
            status_code=status.HTTP_403_FORBIDDEN,
            content={"error": True, "message": "未登入系統，拒絕存取"},
        )

    if not (booking.time == "morning" or booking.time == "afternoon"):
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": True, "message": "旅程只有早上或是下午"},
        )

    today = date.today()
    if booking.date <= today:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": True, "message": "訂單日期必須是未來的日期"},
        )

    connection = None
    try:
        connection = get_db_connection()
        query = "SELECT * FROM ATTRACTIONS WHERE id = %s"
        existing_attractions = execute_query(
            connection, query, (booking.attractionId,), fetch_method="fetchone"
        )
        if not existing_attractions:
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={"error": True, "message": "查無此景點"},
            )

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
        return JSONResponse(status_code=status.HTTP_200_OK, content={"ok": True})
    except mysql.connector.Error as err:
        logger.error("伺服器內部錯誤:%s", err)
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": True, "message": str(err)},
        )
    finally:
        if connection:
            connection.close()


@router.get("/booking")
async def get_booking(request: Request):
    auth_token = request.headers.get("authToken")

    payload = jwt.decode(auth_token, secret_key, algorithms=["HS256"])
    if not payload:
        return JSONResponse(
            status_code=status.HTTP_403_FORBIDDEN,
            content={"error": True, "message": "未登入系統，拒絕存取"},
        )

    connection = None
    try:
        connection = get_db_connection()
        query = """
            SELECT BOOKING.id, BOOKING.attraction_id, ATTRACTIONS.name, ATTRACTIONS.address, 
                   (SELECT url FROM IMAGES WHERE attraction_id = ATTRACTIONS.id LIMIT 1) AS image,
                   BOOKING.date, BOOKING.time_of_day, BOOKING.price
            FROM BOOKING
            JOIN ATTRACTIONS ON BOOKING.attraction_id = ATTRACTIONS.id
            WHERE BOOKING.user_id = %s
        """
        existing_bookings = execute_query(
            connection, query, (payload["id"],), fetch_method="fetchall"
        )

        if not existing_bookings:
            return JSONResponse(status_code=status.HTTP_200_OK, content={"data": None})

        formatted_bookings = []
        for booking in existing_bookings:
            formatted_booking = {
                "id": booking["id"],
                "attraction": {
                    "id": booking["attraction_id"],
                    "name": booking["name"],
                    "address": booking["address"],
                    "image": booking["image"],
                },
                "date": booking["date"].strftime("%Y-%m-%d"),
                "time": booking["time_of_day"],
                "price": booking["price"],
            }
            formatted_bookings.append(formatted_booking)

        return JSONResponse(
            status_code=status.HTTP_200_OK, content={"data": formatted_bookings}
        )
    except mysql.connector.Error as err:
        logger.error("伺服器內部錯誤:%s", err)
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": True, "message": str(err)},
        )
    finally:
        if connection:
            connection.close()


@router.delete("/booking/{booking_id}")
async def delete_booking(request: Request, booking_id: int):
    auth_token = request.headers.get("authToken")

    payload = jwt.decode(auth_token, secret_key, algorithms=["HS256"])
    if not payload:
        return JSONResponse(
            status_code=status.HTTP_403_FORBIDDEN,
            content={"error": True, "message": "未登入系統，拒絕存取"},
        )

    connection = None
    try:
        connection = get_db_connection()
        query = """
            DELETE FROM BOOKING WHERE id = %s AND user_id =%s;
        """
        existing_bookings = execute_query(
            connection,
            query,
            (
                booking_id,
                payload["id"],
            ),
            fetch_method="fetchone",
        )
        if not existing_bookings:
            return JSONResponse(status_code=status.HTTP_200_OK, content={"ok": True})

    except mysql.connector.Error as err:
        logger.error("伺服器內部錯誤:%s", err)
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": True, "message": str(err)},
        )
    finally:
        if connection:
            connection.close()
