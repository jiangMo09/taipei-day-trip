import logging

from fastapi import *
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Optional
import mysql.connector
from utils.mysql import get_db_connection, execute_query


logging.basicConfig(filename="app.log", level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()


# Static Pages (Never Modify Code in this Block)
@app.get("/", include_in_schema=False)
async def index(request: Request):
    return FileResponse("./static/index.html", media_type="text/html")


@app.get("/attraction/{id}", include_in_schema=False)
async def attraction(request: Request, id: int):
    return FileResponse("./static/attraction.html", media_type="text/html")


@app.get("/booking", include_in_schema=False)
async def booking(request: Request):
    return FileResponse("./static/booking.html", media_type="text/html")


@app.get("/thankyou", include_in_schema=False)
async def thankyou(request: Request):
    return FileResponse("./static/thankyou.html", media_type="text/html")


class Attraction(BaseModel):
    id: int
    name: str
    category: str
    description: str
    address: str
    transport: str
    mrt: str
    lat: float
    lng: float
    images: List[str]


@app.get("/api/attractions")
def get_attractions(page: int = Query(0, ge=0), keyword: str = Query(None)):
    connection = None
    print("keyword", keyword)
    try:
        connection = get_db_connection()
        start_index = page * 12

        where_clause = ""
        if keyword:
            where_clause = "WHERE MRT.name = %s OR ATTRACTIONS.name LIKE %s"

        base_query = """
            SELECT ATTRACTIONS.id, ATTRACTIONS.name, ATTRACTIONS.category, ATTRACTIONS.description,ATTRACTIONS.address, ATTRACTIONS.transport, 
            GROUP_CONCAT(DISTINCT MRT.name) AS mrt,
            ATTRACTIONS.lat, ATTRACTIONS.lng, 
            GROUP_CONCAT(DISTINCT IMAGES.url) AS images
            FROM ATTRACTIONS
            LEFT JOIN IMAGES ON ATTRACTIONS.id = IMAGES.attraction_id
            LEFT JOIN MRT ON ATTRACTIONS.mrt_id = MRT.id
            {}
            GROUP BY ATTRACTIONS.id
        """.format(
            where_clause
        )

        query = """
            {base_query}
            LIMIT %s, 12;
        """.format(
            base_query=base_query
        )

        query_params = []

        if keyword:
            query_params.append(keyword)
            query_params.append("%" + keyword + "%")

        query_params.append(start_index)

        attractions_data = execute_query(
            connection, query, tuple(query_params), fetch_method="fetchall"
        )
        attractions = []
        for attraction in attractions_data:
            mrt = attraction[6] if attraction[6] is not None else ""
            images = attraction[9].split(",") if attraction[9] else []
            attractions.append(
                Attraction(
                    id=attraction[0],
                    name=attraction[1],
                    category=attraction[2],
                    description=attraction[3],
                    address=attraction[4],
                    transport=attraction[5],
                    mrt=mrt,
                    lat=attraction[7],
                    lng=attraction[8],
                    images=images,
                )
            )

        next_page = page + 1 if len(attractions) == 12 else None
        return {"nextPage": next_page, "data": attractions}

    except mysql.connector.Error as err:
        logger.error("資料庫連線錯誤: %s", err)
        return {"error": "true", "message": "伺服器內部錯誤"}
    finally:
        if connection:
            connection.close()


@app.get("/api/attraction/{attraction_id}")
def get_attraction(attraction_id: int):
    connection = None
    try:
        connection = get_db_connection()
        query = "SELECT ATTRACTIONS.*, MRT.name AS mrt FROM ATTRACTIONS LEFT JOIN MRT ON ATTRACTIONS.mrt_id = MRT.id WHERE ATTRACTIONS.id = %s"
        query_images = "SELECT url FROM IMAGES WHERE attraction_id = %s"
        result_attraction = execute_query(
            connection, query, (attraction_id,), fetch_method="fetchone"
        )
        if not result_attraction:
            return {"error": "true", "message": "景點編號不正確"}

        result_images = execute_query(
            connection, query_images, (attraction_id,), fetch_method="fetchall"
        )
        image_urls = [image[0] for image in result_images]

        attraction_data = {
            "id": result_attraction[0],
            "name": result_attraction[1],
            "category": result_attraction[2],
            "description": result_attraction[3],
            "address": result_attraction[4],
            "transport": result_attraction[5],
            "mrt": (
                str(result_attraction[10]) if result_attraction[10] is not None else ""
            ),
            "lat": result_attraction[7],
            "lng": result_attraction[8],
            "images": image_urls,
        }

        return {"data": Attraction(**attraction_data)}
    except mysql.connector.Error as err:
        logger.error("資料庫連線錯誤: %s", err)
        return {"error": "true", "message": "伺服器內部錯誤"}
    finally:
        if connection:
            connection.close()


@app.get("/api/mrts")
def get_mrt():
    connection = None
    try:
        connection = get_db_connection()
        query = "SELECT * FROM MRT"
        mrts = execute_query(connection, query, None, fetch_method="fetchall")
        sorted_mrts = sorted(mrts, key=lambda mrt: mrt[2], reverse=True)
        sorted_mrts_names = [sorted_mrt[1] for sorted_mrt in sorted_mrts]

        return {"data": sorted_mrts_names}
    except mysql.connector.Error as err:
        logger.error("資料庫連線錯誤: %s", err)
        return {"error": "true", "message": "伺服器內部錯誤"}
    finally:
        if connection:
            connection.close()
