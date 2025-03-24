from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.services.db import get_db
from app.services.payment_service import PaymentService
from app.models.payment_model import PaymentRequest

router = APIRouter()

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
