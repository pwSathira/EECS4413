
from pydantic import BaseModel
from typing import List

# Pydantic model for Order request
class Order(BaseModel):
    user_name: str  # The name of the user placing the order
    street_address: str  # The user's street address
    phone_number: str  # The user's phone number
    province: str  # The province or state of the user
    country: str  # The user's country
    postal_code: str  # Postal code for the user's address
    total_paid: float  # Total price paid (item price + shipping fee)
    item_id: int  # The ID of the item being ordered

    class Config:
        orm_mode = True
