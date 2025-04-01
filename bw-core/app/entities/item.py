from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
from datetime import datetime


class ItemBase(SQLModel):
    name: str
    description: str
    initial_price: float
    image_url: Optional[str] = None


class Item(ItemBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.now)
    
    # Relationships
    auctions: List["Auction"] = Relationship(back_populates="item")
    orders: List["Order"] = Relationship(back_populates="item")


class ItemCreate(ItemBase):
    pass


class ItemRead(ItemBase):
    id: int
    created_at: datetime


class ItemUpdate(SQLModel):
    name: Optional[str] = None
    description: Optional[str] = None
    initial_price: Optional[float] = None
    image_url: Optional[str] = None
