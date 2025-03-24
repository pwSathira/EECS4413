from sqlmodel import SQLModel, Field

class ValidPayment(SQLModel, table=True):
    id: int = Field(default=None, primary_key=True)
    card_number: str
    card_holder_name: str
    expiry_date: str
    security_code: str