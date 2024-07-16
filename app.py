import logging
import os
import requests
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from routers import api_router
from utils.load_env import MY_IPS


logger = logging.getLogger("app")
file_handler = logging.FileHandler("access.log")
formatter = logging.Formatter("%(asctime)s - %(message)s")
file_handler.setFormatter(formatter)
logger.addHandler(file_handler)
logger.setLevel(logging.INFO)


app = FastAPI()

is_production = os.getenv("ENVIRONMENT") == "production"
CDN_BASE_URL = "https://dal3kbb5hx215.cloudfront.net/static"

if not is_production:
    app.mount("/static", StaticFiles(directory="static"), name="static")

app.include_router(api_router)


@app.middleware("http")
async def log_ip_address(request: Request, call_next):
    ip_address = request.client.host
    if ip_address not in MY_IPS:
        logger.info(f"Request from IP: {ip_address} to URL: {request.url}")
    response = await call_next(request)
    return response


# Static Pages (Never Modify Code in this Block)
@app.get("/", include_in_schema=False)
async def index(request: Request):
    return serve_static_page("index.html")


@app.get("/attraction/{id}", include_in_schema=False)
async def attraction(request: Request, id: int):
    return serve_static_page("attraction.html")


@app.get("/booking", include_in_schema=False)
async def booking(request: Request):
    return serve_static_page("booking.html")


@app.get("/thankyou", include_in_schema=False)
async def thankyou(request: Request):
    return serve_static_page("thankyou.html")


def serve_static_page(file_name: str):
    if is_production:
        return HTMLResponse(content=get_html_content(file_name), status_code=200)
    else:
        return FileResponse(f"./static/{file_name}", media_type="text/html")


def get_html_content(file_name: str) -> str:
    if is_production:
        url = f"{CDN_BASE_URL}/{file_name}"
        response = requests.get(url)
        if response.status_code == 200:
            content = response.text.replace("/static/", f"{CDN_BASE_URL}/")

        else:
            raise HTTPException(status_code=404, detail="Page not found")
    else:
        with open(f"./static/{file_name}", "r") as file:
            content = file.read()

    return content
