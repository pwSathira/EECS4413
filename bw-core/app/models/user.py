from pydantic import BaseModel, Field
from app.entities.user import UserRole  # Import the role enum
from typing import Optional
from typing import List
from datetime import datetime



# Request model to create a new user.
class UserCreate(BaseModel):
    username: str
    email: str
    password: str = Field(..., example="string@12345")
    role: UserRole  # Choose 'buyer' or 'seller'
    street: str
    city: str
    country: str
    postal_code: str


# Response model for a user.
class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    role: UserRole  # Add user role
    listed_auctions: List[int] = []  # Auction IDs if user is a seller
    bidding_on_auctions: List[int] = []  # Auction IDs if user is a buyer

    class Config:
        from_attributes = True

# Request model to authenticate a user.
class UserAuthenticate(BaseModel):
    email: str
    password: str

# Request model to update a user.
class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    street: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None


class UserProfileResponse(BaseModel):
    id: int
    username: str
    email: str
    role: UserRole
    total_bids_placed: int
    total_auctions_created: int
    total_won_auctions: int
    last_activity: Optional[datetime] = None

    class Config:
        from_attributes = True    
