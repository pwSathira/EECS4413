from sqlalchemy.orm import Session
from app.entities.validpaymentinfo import ValidPayment

class PaymentVerificationService:
    @staticmethod
    def verify_payment_info(db: Session, card_number: str, card_holder_name: str, expiry_date: str, security_code: str) -> bool:
        return db.query(ValidPayment).filter_by(
            card_number=card_number,
            card_holder_name=card_holder_name,
            expiry_date=expiry_date,
            security_code=security_code
        ).first() is not None
