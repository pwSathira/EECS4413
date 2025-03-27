from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from typing import List
from app.models.user import UserResponse, UserUpdate
from app.services.user import *
from app.services.db import get_db
from app.models.user import UserCreate
from app.entities.user import UserRole
from typing import Optional
from app.models.user import UserAuthenticate
from datetime import datetime, timedelta
from fastapi import BackgroundTasks
from app.models.user import UserProfileResponse



router = APIRouter(prefix="/user", tags=["User Management"])

#@router.get("/", response_model=List[UserResponse])
#def list_users(db: Session = Depends(get_db)):
 #   return get_all_users(db)

@router.get("/", response_model=List[UserResponse])
def list_users(db: Session = Depends(get_db)):
    users = get_all_users(db)
    user_list = []
    
    for user in users:
        # Get auctions where user is the seller
        listed_auctions = [auction.id for auction in user.auctions]

        # Get auctions where user is bidding
        bidding_on_auctions = [bid.auction_id for bid in user.bids]

        user_list.append(UserResponse(
            id=user.id,
            username=user.username,
            email=user.email,
            role=user.role,
            listed_auctions=listed_auctions,
            bidding_on_auctions=bidding_on_auctions
        ))
    
    return user_list


@router.get("/{user_id}", response_model=UserResponse)
def read_user(user_id: int, db: Session = Depends(get_db)):
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
@router.get("/search/", response_model=List[UserResponse])
def search_users(query: str, db: Session = Depends(get_db)):
    users = search_users_in_db(db, query)
    return users


@router.post("/", response_model=UserResponse)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    existing_user = get_user_by_email(db, user.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return create_user_in_db(db, user)

@router.put("/{user_id}", response_model=UserResponse)
def update_user(user_id: int, user_update: UserUpdate, db: Session = Depends(get_db)):
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Prevent duplicate email updates
    if user_update.email and user_update.email.lower() != user.email.lower():
        existing_user = get_user_by_email(db, user_update.email.lower())
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")

    # Update only provided fields
    for field, value in user_update.dict(exclude_unset=True).items():
        setattr(user, field, value.lower() if field in ["username", "email"] else value)

    db.commit()
    db.refresh(user)
    return user



@router.get("/{user_id}/profile", response_model=UserProfileResponse)
def get_user_profile(user_id: int, db: Session = Depends(get_db)):
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Count total auctions created by the user (if seller)
    total_auctions_created = len(user.auctions)

    # Count total bids placed by the user (if buyer)
    total_bids_placed = len(user.bids)

    # Count how many auctions they won
    total_won_auctions = sum(1 for bid in user.bids if bid.auction.winning_bid_id == bid.id)

    # Find last activity timestamp
    last_bid_time = max((bid.created_at for bid in user.bids), default=None)
    last_auction_time = max((auction.created_at for auction in user.auctions), default=None)
    last_activity = max(filter(None, [last_bid_time, last_auction_time]), default=None)

    return UserProfileResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        role=user.role,
        total_bids_placed=total_bids_placed,
        total_auctions_created=total_auctions_created,
        total_won_auctions=total_won_auctions,
        last_activity=last_activity
    )


@router.patch("/{user_id}/role")
def change_user_role(user_id: int, new_role: UserRole, db: Session = Depends(get_db)):
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Prevent buyers from switching to sellers if they have active bids
    if user.role == UserRole.BUYER and new_role == UserRole.SELLER:
        if has_active_bids(db, user_id):
            raise HTTPException(status_code=400, detail="You cannot switch to a seller while you have active bids.")

    # If no restrictions, allow role change
    user.role = new_role
    db.commit()
    db.refresh(user)
    return {"message": f"User role updated to {new_role}"}



@router.delete("/{user_id}", response_model=UserResponse)
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db.delete(user)
    db.commit()
    return user



@router.get("/search/", response_model=List[UserResponse])
def search_users(query: Optional[str] = None, role: Optional[UserRole] = None, db: Session = Depends(get_db)):
    statement = select(User)
    
    # Apply search filter if provided
    if query:
        statement = statement.where(
            (User.username.ilike(f"%{query}%")) | (User.email.ilike(f"%{query}%"))
        )

    # Apply role filter if provided
    if role:
        statement = statement.where(User.role == role)

    users = db.exec(statement).all()
    return users



# Temporary storage for failed login attempts
failed_login_attempts = {}

def reset_failed_attempts(username: str):
    """Resets the failed login count after timeout."""
    if username in failed_login_attempts:
        del failed_login_attempts[username]

@router.post("/login", response_model=UserResponse)
def login(user_data: UserAuthenticate, db: Session = Depends(get_db), background_tasks: BackgroundTasks = None):
    user = get_user_by_email(db, user_data.email)

    if not user:
        raise HTTPException(status_code=404, detail="User does not exist")

    # Check if the user has too many failed attempts
    if user.email in failed_login_attempts:
        attempts, lockout_time = failed_login_attempts[user.email]
        if attempts >= 5 and lockout_time > datetime.utcnow():
            raise HTTPException(status_code=429, detail="Too many failed attempts. Try again later.")

    # Verify password
    if not verify_password(user_data.password, user.password):
        # Track failed attempts
        if user.email not in failed_login_attempts:
            failed_login_attempts[user.email] = (1, datetime.utcnow() + timedelta(minutes=5))
        else:
            attempts, _ = failed_login_attempts[user.email]
            failed_login_attempts[user.email] = (attempts + 1, datetime.utcnow() + timedelta(minutes=5))

        raise HTTPException(status_code=401, detail="Incorrect password")

    # Reset failed attempts on successful login
    background_tasks.add_task(reset_failed_attempts, user.email)

    return user


