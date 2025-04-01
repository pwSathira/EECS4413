from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.services.db import get_db
from app.services.payment_service import PaymentService
from app.models.payment_model import PaymentRequest
from app.services.order_service import OrderService
from app.services.auction_service import get_auction_with_winner
from app.entities.validpaymentinfo import ValidPayment

router = APIRouter(
    prefix="/payments",
    tags=["payments"],
)

@router.post("/add-payment", response_model=bool)
def add_payment(payment_data: PaymentRequest, db: Session = Depends(get_db)):
    validity = PaymentService.add_payment_method(
        db,
        payment_data.card_number,
        payment_data.card_holder_name,
        payment_data.expiry_date,
        payment_data.security_code
    )

    if not validity:
        raise HTTPException(status_code=400, detail="Payment information is invalid.")
    
    return validity

@router.post("/process-auction-payment/{auction_id}", response_model=dict)
def process_auction_payment(
    auction_id: int,
    payment_data: PaymentRequest,
    db: Session = Depends(get_db)
):
    # Get auction details with winner info
    auction_data = get_auction_with_winner(db, auction_id)
    if not auction_data or "winner" not in auction_data:
        raise HTTPException(status_code=404, detail="No winner found for this auction")

    # Verify payment
    is_valid = PaymentService.add_payment_method(
        db,
        payment_data.card_number,
        payment_data.card_holder_name,
        payment_data.expiry_date,
        payment_data.security_code
    )

    if not is_valid:
        raise HTTPException(status_code=400, detail="Payment information is invalid")

    # Create order from auction
    try:
        order_result = OrderService.add_order_from_auction(
            db,
            auction_id,
            auction_data["winning_amount"],
            auction_data["item"]["id"]
        )
        return {
            "message": "Payment processed and order created successfully",
            "order_id": order_result["order_id"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/create-test-payment", response_model=dict)
def create_test_payment(db: Session = Depends(get_db)):
    """Create a test payment record for testing purposes"""
    test_payment = ValidPayment(
        card_number="4111111111111111",  # Test Visa card
        card_holder_name="Test User",
        expiry_date="12/25",
        security_code="123"
    )
    
    db.add(test_payment)
    db.commit()
    
    return {
        "message": "Test payment record created successfully",
        "card_number": "4111111111111111",
        "card_holder_name": "Test User",
        "expiry_date": "12/25",
        "security_code": "123"
    }
