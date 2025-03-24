from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
from datetime import datetime


class BidBase(SQLModel):
    amount: float
    bidder_name: str
    bidder_email: str
    user_id: int = Field(foreign_key="user.id")
    auction_id: int = Field(foreign_key="auction.id")


class Bid(BidBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.now)

    # Relationship to the user who placed the bid
    user: "User" = Relationship(back_populates="bids")
    
    # Relationship to the auction this bid belongs to
    auction: "Auction" = Relationship(
        back_populates="bids",
        sa_relationship_kwargs={"foreign_keys": "[Bid.auction_id]"}
    )


class BidCreate(BidBase):
    pass


class BidRead(BidBase):
    id: int
    amount: float
    bidder_name: str
    bidder_email: str
    user_id: int
    auction_id: int
    created_at: datetime

    class Config:
        orm_mode = True


class BidUpdate(SQLModel):
    amount: Optional[float] = None
    bidder_name: Optional[str] = None
    bidder_email: Optional[str] = None
