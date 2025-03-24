from sqlmodel import SQLModel, Field

class PaymentMethod(SQLModel, table=True):
    transaction_id: int = Field(default=None, primary_key=True, index=True) 
    last_four_digits: str
    card_brand: str
    payment_status: str
