from sqlalchemy.orm import Session
from app.entities.paymentmethod import PaymentMethod
from app.services.payment_verification_service import PaymentVerificationService

class PaymentService:
    @staticmethod
    def add_payment_method(db: Session, card_number: str, card_holder_name: str, expiry_date: str, security_code: str) -> bool:
        # Verify payment
        is_valid = PaymentVerificationService.verify_payment_info(
            db, card_number, card_holder_name, expiry_date, security_code
        )

        # Create PaymentMethod entry
        new_payment = PaymentMethod(
            last_four_digits=card_number[-4:],  
            card_brand="Visa" if card_number.startswith("4") else "MasterCard",  
            payment_status="Completed" if is_valid else "Failed"
        )

        db.add(new_payment)
        db.commit()
        db.refresh(new_payment)

        return is_valid
