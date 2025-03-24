from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.docs import get_swagger_ui_html

from .routers import hello, auction_router, item_router, bid_router, user, order_router, payment_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(hello.router, prefix="/api/v1")
app.include_router(user.router, prefix="/api/v1")
app.include_router(auction_router.router, prefix="/api/v1") 
app.include_router(item_router.router, prefix="/api/v1")
app.include_router(bid_router.router, prefix="/api/v1")
app.include_router(order_router.router, prefix="/api/v1")
app.include_router(payment_router.router, prefix="/api/v1")

@app.get("/", include_in_schema=False)
async def root():
    return get_swagger_ui_html(openapi_url="/openapi.json", title="BidWize API")
