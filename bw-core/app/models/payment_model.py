from pydantic import BaseModel

class PaymentRequest(BaseModel):
    card_number: str
    card_holder_name: str
    expiry_date: str
    security_code: str
