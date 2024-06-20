import logging

from fastapi import FastAPI, Request
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
import os
from routers import api_router

load_dotenv()

MY_IPS = os.getenv("MY_IPS")

logger = logging.getLogger("app")
file_handler = logging.FileHandler("access.log")
formatter = logging.Formatter("%(asctime)s - %(message)s")
file_handler.setFormatter(formatter)
logger.addHandler(file_handler)
logger.setLevel(logging.INFO)


app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")

app.include_router(api_router)


@app.middleware("http")
async def log_ip_address(request: Request, call_next):
    ip_address = request.client.host

    if not ip_address in MY_IPS:
        logger.info(f"Request from IP: {ip_address} to URL: {request.url}")
    response = await call_next(request)
    return response


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
