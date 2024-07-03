from fastapi import APIRouter, Request, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr, Field
from typing import List
import jwt
import mysql.connector
import requests

from utils.logger_api import setup_logger
from utils.mysql import get_db_connection, execute_query
from utils.load_env import JWT_SECRET_KEY, TAPPAY_MERCHANT_ID, TAPPAY_PARTNER_KEY

router = APIRouter()
logger = setup_logger("api.orders", "app.log")


class Attraction(BaseModel):
    id: int
    name: str
    address: str
    image: str


class Trip(BaseModel):
    attraction: Attraction
    date: str
    time: str


class Contact(BaseModel):
    name: str
    email: EmailStr
    phone: str = Field(..., pattern="^09\d{8}$")


class OrderDetails(BaseModel):
    price: int
    trips: List[Trip]
    contact: Contact


class Order(BaseModel):
    prime: str
    order: OrderDetails


@router.post("/orders")
async def post_orders(request: Request, order: Order):
    auth_token = request.headers.get("authToken")

    payload = jwt.decode(auth_token, JWT_SECRET_KEY, algorithms=["HS256"])
    if not payload:
        return JSONResponse(
            status_code=status.HTTP_403_FORBIDDEN,
            content={"error": True, "message": "未登入系統，拒絕存取"},
        )

    user_id = payload["id"]
    connection = None
    try:
        connection = get_db_connection()

        order_query = """
        SELECT order_number FROM ORDERS
        WHERE user_id = %s AND status = 'UNPAID'
        """
        order_result = execute_query(connection, order_query, (user_id,))

        if not order_result:
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={"error": True, "message": "沒有找到待處理的訂單"},
            )

        order_number = order_result["order_number"]

        booking_query = """
        SELECT time_of_day FROM BOOKING
        WHERE order_number = %s
        """
        bookings = execute_query(
            connection, booking_query, (order_number,), fetch_method="fetchall"
        )

        total_price = 0
        for booking in bookings:
            time_of_day = booking["time_of_day"]
            if time_of_day == "morning":
                total_price += 2000
            elif time_of_day == "afternoon":
                total_price += 2500

        if total_price != order.order.price:
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"error": True, "message": "前端送出價格與後端驗證價格不同"},
            )

        TAPPAY_URL = "https://sandbox.tappaysdk.com/tpc/payment/pay-by-prime"
        headers = {
            "Content-Type": "application/json",
            "x-api-key": TAPPAY_PARTNER_KEY,
        }
        TAPPAY_PAYLOAD = {
            "prime": order.prime,
            "partner_key": TAPPAY_PARTNER_KEY,
            "merchant_id": TAPPAY_MERCHANT_ID,
            "details": "TapPay Test",
            "amount": total_price,
            "order_number": order_number,
            "cardholder": {
                "phone_number": order.order.contact.phone,
                "name": order.order.contact.name,
                "email": order.order.contact.email,
            },
            "remember": True,
        }
        tappay_response = requests.post(
            TAPPAY_URL, json=TAPPAY_PAYLOAD, headers=headers
        )
        result = tappay_response.json()

        tappay_status = "PAID" if result["status"] == 0 else "UNPAID"

        update_query = """
        UPDATE ORDERS
        SET status = %s, price = %s, name = %s, email = %s, phone = %s
        WHERE order_number = %s
        """
        execute_query(
            connection,
            update_query,
            (
                tappay_status,
                order.order.price,
                order.order.contact.name,
                order.order.contact.email,
                order.order.contact.phone,
                order_number,
            ),
        )

        response_content = {}
        if result["status"] == 0:
            response_content = {
                "data": {
                    "number": order_number,
                    "payment": {
                        "status": result["status"],
                        "message": (
                            "付款成功" if result["msg"] == "Success" else result["msg"]
                        ),
                    },
                }
            }
        else:
            response_content = {
                "error": True,
                "message": "付款失敗，請稍後再試",
            }

        return JSONResponse(status_code=status.HTTP_200_OK, content=response_content)

    except mysql.connector.Error as err:
        if connection:
            connection.rollback()
        logger.error("伺服器內部錯誤:%s", err)
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": True, "message": "伺服器內部錯誤"},
        )
    finally:
        if connection:
            connection.close()


class OrderData(BaseModel):
    number: int
    price: int
    trips: List[Trip]
    contact: Contact
    status: int


class OrderResponse(BaseModel):
    data: OrderData


@router.get("/order/{order_number}", response_model=OrderResponse)
async def get_orders(request: Request, order_number: int):
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
            O.price,
            O.name,
            O.email,
            O.phone,
            O.status,
            B.attraction_id,
            B.time_of_day,
            B.date,
            A.name AS attraction_name,
            A.address AS attraction_address,
            I.url AS image_url
        FROM 
            ORDERS O
        JOIN 
            BOOKING B ON O.order_number = B.order_number
        JOIN 
            ATTRACTIONS A ON B.attraction_id = A.id
        LEFT JOIN 
            (SELECT attraction_id, MIN(url) AS url
             FROM IMAGES
             GROUP BY attraction_id) I ON A.id = I.attraction_id
        WHERE 
            O.order_number = %s AND O.user_id = %s
        """

        results = execute_query(
            connection,
            query,
            (
                order_number,
                payload["id"],
            ),
            fetch_method="fetchall",
        )

        if not results:
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={"error": True, "message": "沒有找到待處理的訂單"},
            )

        trips = [
            Trip(
                attraction=Attraction(
                    id=result["attraction_id"],
                    name=result["attraction_name"],
                    address=result["attraction_address"],
                    image=result["image_url"],
                ),
                date=result["date"].isoformat(),
                time=result["time_of_day"],
            )
            for result in results
        ]

        order_data = OrderData(
            number=order_number,
            price=results[0]["price"],
            trips=trips,
            contact=Contact(
                name=results[0]["name"],
                email=results[0]["email"],
                phone=results[0]["phone"],
            ),
            status=0 if results[0]["status"] == "PAID" else 1,
        )

        response = OrderResponse(data=order_data)

        return response

    except mysql.connector.Error as err:
        logger.error("伺服器內部錯誤:%s", err)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": True, "message": "伺服器內部錯誤"},
        )
    finally:
        if connection:
            connection.close()
