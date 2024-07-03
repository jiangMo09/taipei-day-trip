from datetime import date
import random

from fastapi import APIRouter, Request, status, WebSocket
from starlette.websockets import WebSocketDisconnect
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import jwt
import mysql.connector

from utils.logger_api import setup_logger
from utils.mysql import get_db_connection, execute_query
from utils.load_env import JWT_SECRET_KEY

router = APIRouter()
logger = setup_logger("api.booking", "app.log")


active_connections = {}


@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await websocket.accept()
    active_connections[user_id] = websocket
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        del active_connections[user_id]


async def notify_booking_created(user_id: str):
    if user_id in active_connections:
        await active_connections[user_id].send_json({"action": "refresh_booking"})


class Booking(BaseModel):
    attractionId: int
    date: date
    time: str
    price: int


@router.post("/booking")
async def create_booking(request: Request, booking: Booking):
    auth_token = request.headers.get("authToken")

    payload = jwt.decode(auth_token, JWT_SECRET_KEY, algorithms=["HS256"])
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

        order_number = None
        query = "SELECT order_number FROM ORDERS WHERE user_id = %s AND status = 'UNPAID'"
        existing_order = execute_query(
            connection, query, (payload["id"],), fetch_method="fetchone"
        )

        if existing_order:
            order_number = existing_order["order_number"]
        else:
            insert_success = False
            max_attempts = 5
            attempts = 0

            while not insert_success and attempts < max_attempts:
                order_number = "".join([str(random.randint(0, 9)) for _ in range(14)])
                query = "INSERT INTO ORDERS (order_number, user_id, status) VALUES (%s, %s, 'UNPAID')"
                try:
                    execute_query(connection, query, (order_number, payload["id"]))
                    insert_success = True
                except mysql.connector.IntegrityError as err:
                    if "Duplicate entry" in str(err):
                        attempts += 1
                        continue
                    else:
                        raise err

            if not insert_success:
                return JSONResponse(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    content={
                        "error": True,
                        "message": "無法生成唯一的訂單號，請稍後再試",
                    },
                )

        query = "INSERT INTO BOOKING (attraction_id, user_id, order_number, time_of_day, date, price) VALUES (%s, %s, %s, %s, %s, %s)"
        execute_query(
            connection,
            query,
            (
                booking.attractionId,
                payload["id"],
                order_number,
                booking.time,
                booking.date,
                booking.price,
            ),
        )

        await notify_booking_created(str(payload["id"]))
        return JSONResponse(status_code=status.HTTP_200_OK, content={"ok": True})
    except mysql.connector.Error as err:
        logger.error("伺服器內部錯誤:%s", err)
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": True, "message": "伺服器內部錯誤"},
        )
    finally:
        if connection:
            connection.close()


@router.get("/booking")
async def get_booking(request: Request):
    auth_token = request.headers.get("authToken")

    payload = jwt.decode(auth_token, JWT_SECRET_KEY, algorithms=["HS256"])
    if not payload:
        return JSONResponse(
            status_code=status.HTTP_403_FORBIDDEN,
            content={"error": True, "message": "未登入系統，拒絕存取"},
        )

    connection = None
    try:
        connection = get_db_connection()
        query = """
            SELECT 
                BOOKING.id, 
                BOOKING.attraction_id, 
                ATTRACTIONS.name, 
                ATTRACTIONS.address, 
                (SELECT url FROM IMAGES WHERE attraction_id = ATTRACTIONS.id LIMIT 1) AS image,
                BOOKING.date, 
                BOOKING.time_of_day, 
                BOOKING.price,
                ORDERS.status
            FROM 
                BOOKING
            JOIN 
                ATTRACTIONS ON BOOKING.attraction_id = ATTRACTIONS.id
            JOIN 
                ORDERS ON BOOKING.order_number = ORDERS.order_number
            WHERE 
                BOOKING.user_id = %s
                AND ORDERS.status = 'UNPAID'
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
            content={"error": True, "message": "伺服器內部錯誤"},
        )
    finally:
        if connection:
            connection.close()


@router.delete("/booking/{booking_id}")
async def delete_booking(request: Request, booking_id: int):
    auth_token = request.headers.get("authToken")

    payload = jwt.decode(auth_token, JWT_SECRET_KEY, algorithms=["HS256"])
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
            content={"error": True, "message": "伺服器內部錯誤"},
        )
    finally:
        if connection:
            connection.close()
