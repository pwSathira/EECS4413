from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.services.order_service import OrderService
from app.services.db import get_db
from typing import List
from app.entities.order import Order
from sqlmodel import select

router = APIRouter()

@router.get("/orders/auction/get/{auction_id}")
def get_order_by_auction(auction_id: int, db: Session = Depends(get_db)):
    try:
        return OrderService.get_order(db, auction_id)
    except HTTPException as e:
        raise e

@router.get("/orders/user/{user_id}", response_model=List[Order])
def get_user_orders(user_id: int, db: Session = Depends(get_db)):
    try:
        # Use select to join with Item table
        statement = select(Order).where(Order.user_id == user_id).join(Order.item)
        orders = db.exec(statement).all()
        return orders
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# @router.post("/orders/", response_model=dict)
# def create_order(order_data: OrderRequest, db: Session = Depends(get_db)):
#     try:
#         return OrderService.add_order(db, order_data)
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))
    
@router.post("/orders/auction/add/{auction_id}", response_model=dict)
def create_order_from_auction(
    auction_id: int, 
    total_paid: float, 
    item_id: int,
    db: Session = Depends(get_db)
):
    try:
        return OrderService.add_order_from_auction(db, auction_id, total_paid, item_id)
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))