from sqlmodel import Field, SQLModel, Relationship
from typing import List, Optional

class Order(SQLModel, table=True):
    id: int = Field(primary_key=True)
    user_id: int = Field(foreign_key="user.id")  # Foreign key to User
    user_name: str
    street_address: str
    phone_number: str
    province: str
    country: str
    postal_code: str
    total_paid: float  # Total price paid (item price + shipping fee)
    item_id: int = Field(foreign_key="item.id")  # Foreign key to Item
    auction_id: int = Field(foreign_key="auction.id")  # Foreign key to Auction

    user: "User" = Relationship(back_populates="orders")  # Relationship to User
    item: "Item" = Relationship(back_populates="orders")  # Relationship to Item

    class Config:
        orm_mode = True
        from_attributes = True
