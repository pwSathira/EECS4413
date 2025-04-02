from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.services.order_service import OrderService
from app.services.db import get_db
from typing import List
from app.entities.order import Order
from sqlmodel import select
from email.message import EmailMessage
from aiosmtplib import send
from app.models.order import Order  # Assuming you have an Order model

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
    

@router.post("/orders/{order_id}/email")
async def email_order_details(order_id: int, db: Session = Depends(get_db)):
    """
    Sends an email with the details of the specified order.
    """
    # Fetch the order details
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Create the email content
    email_body = f"""
    <h1>Order Details</h1>
    <p><strong>Order ID:</strong> {order.id}</p>
    <p><strong>Item:</strong> {order.item_name}</p>
    <p><strong>Total Paid:</strong> ${order.total_paid:.2f}</p>
    <p><strong>Shipping Address:</strong></p>
    <p>{order.street_address}</p>
    <p>{order.province}, {order.country}</p>
    <p>{order.postal_code}</p>
    """

    # Create the email message
    message = EmailMessage()
    message["From"] = "your_email@example.com"  # Replace with your email
    message["To"] = order.user.email  # Assuming the order has a user with an email
    message["Subject"] = "Your Order Details"
    message.set_content(email_body, subtype="html")

    # Send the email using aiosmtplib
    try:
        await send(
            message,
            hostname="smtp.example.com",  # Replace with your SMTP server
            port=587,  # Replace with your SMTP port
            username="your_email@example.com",  # Replace with your email username
            password="your_password",  # Replace with your email password
            use_tls=True,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")

    return {"message": "Order details emailed successfully"}