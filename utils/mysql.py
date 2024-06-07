import mysql.connector
from dotenv import load_dotenv
import os

load_dotenv()

dbconfig = {
    "host": os.getenv("DB_HOST"),
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
    "database": os.getenv("DB_NAME"),
}

pool = mysql.connector.pooling.MySQLConnectionPool(
    pool_name="mypool", pool_size=32, **dbconfig
)


def get_db_connection():
    connection = pool.get_connection()
    return connection


def execute_query(connection, query, values=None, fetch_method="fetchone"):
    with connection.cursor(dictionary=True) as cursor:
        if values:
            cursor.execute(query, values)
        else:
            cursor.execute(query)

        fetch_function = getattr(cursor, fetch_method)
        result = fetch_function()

        if not query.lstrip().upper().startswith("SELECT"):
            connection.commit()

    return result
