import logging

from typing import List
from fastapi import APIRouter, Query
from pydantic import BaseModel
import mysql.connector
from utils.mysql import get_db_connection, execute_query


logger = logging.getLogger("api.home")
file_handler = logging.FileHandler("app.log")
formatter = logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")
file_handler.setFormatter(formatter)
logger.addHandler(file_handler)
logger.setLevel(logging.INFO)


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


router = APIRouter()


@router.get("/api/attractions")
def get_attractions(page: int = Query(0, ge=0), keyword: str = Query(None)):
    connection = None
    try:
        connection = get_db_connection()
        start_index = page * 12

        where_clause = ""
        if keyword:
            where_clause = "WHERE MRT.name = %s OR ATTRACTIONS.name LIKE %s"

        base_query = """
            SELECT ATTRACTIONS.id, ATTRACTIONS.name, ATTRACTIONS.category, ATTRACTIONS.description, ATTRACTIONS.address, ATTRACTIONS.transport, 
            GROUP_CONCAT(DISTINCT MRT.name) AS mrt, ATTRACTIONS.lat, ATTRACTIONS.lng, 
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
            LIMIT %s, 13;
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

        has_next_page = len(attractions_data) > 12
        attractions_data = attractions_data[:12] 

        attractions = []
        for attraction in attractions_data:
            images_list = (
                attraction["images"].split(",") if attraction["images"] else []
            )
            attractions.append(
                Attraction(
                    id=attraction["id"],
                    name=attraction["name"],
                    category=attraction["category"],
                    description=attraction["description"],
                    address=attraction["address"],
                    transport=attraction["transport"],
                    mrt=attraction["mrt"] if attraction["mrt"] is not None else "",
                    lat=attraction["lat"],
                    lng=attraction["lng"],
                    images=images_list,
                )
            )

        next_page = page + 1 if has_next_page else None
        return {"nextPage": next_page, "data": attractions}

    except mysql.connector.Error as err:
        logger.error("資料庫連線錯誤: %s", err)
        return {"error": "true", "message": "伺服器內部錯誤"}
    finally:
        if connection:
            connection.close()


@router.get("/api/attraction/{attraction_id}")
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
        image_urls = [image["url"] for image in result_images]

        attraction_data = {
            "id": result_attraction["id"],
            "name": result_attraction["name"],
            "category": result_attraction["category"],
            "description": result_attraction["description"],
            "address": result_attraction["address"],
            "transport": result_attraction["transport"],
            "mrt": (
                result_attraction["mrt"] if result_attraction["mrt"] is not None else ""
            ),
            "lat": result_attraction["lat"],
            "lng": result_attraction["lng"],
            "images": image_urls,
        }

        return {"data": Attraction(**attraction_data)}
    except mysql.connector.Error as err:
        logger.error("資料庫連線錯誤: %s", err)
        return {"error": "true", "message": "伺服器內部錯誤"}
    finally:
        if connection:
            connection.close()


@router.get("/api/mrts")
def get_mrt():
    connection = None
    try:
        connection = get_db_connection()
        query = "SELECT * FROM MRT"
        mrts = execute_query(connection, query, None, fetch_method="fetchall")
        sorted_mrts = sorted(mrts, key=lambda mrt: mrt["name"], reverse=True)
        sorted_mrts_names = [sorted_mrt["name"] for sorted_mrt in sorted_mrts]

        return {"data": sorted_mrts_names}
    except mysql.connector.Error as err:
        logger.error("資料庫連線錯誤: %s", err)
        return {"error": "true", "message": "伺服器內部錯誤"}
    finally:
        if connection:
            connection.close()
