import logging

from typing import List
from fastapi import APIRouter, Query
from pydantic import BaseModel
import mysql.connector
from utils.mysql import get_db_connection, execute_query

logging.basicConfig(filename="app.log", level=logging.INFO)
logger = logging.getLogger(__name__)


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
            (
                id,
                name,
                category,
                description,
                address,
                transport,
                mrt,
                lat,
                lng,
                images,
            ) = attraction
            images_list = images.split(",") if images else []
            attractions.append(
                Attraction(
                    id=id,
                    name=name,
                    category=category,
                    description=description,
                    address=address,
                    transport=transport,
                    mrt=mrt if mrt is not None else "",
                    lat=lat,
                    lng=lng,
                    images=images_list,
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
        image_urls = [image[0] for image in result_images]

        (id, name, category, description, address, transport, lat, lng, mrt) = (
            result_attraction
        )

        attraction_data = {
            "id": id,
            "name": name,
            "category": category,
            "description": description,
            "address": address,
            "transport": transport,
            "mrt": mrt if mrt is not None else "",
            "lat": lat,
            "lng": lng,
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
        sorted_mrts = sorted(mrts, key=lambda mrt: mrt[2], reverse=True)
        sorted_mrts_names = [sorted_mrt[1] for sorted_mrt in sorted_mrts]

        return {"data": sorted_mrts_names}
    except mysql.connector.Error as err:
        logger.error("資料庫連線錯誤: %s", err)
        return {"error": "true", "message": "伺服器內部錯誤"}
    finally:
        if connection:
            connection.close()
