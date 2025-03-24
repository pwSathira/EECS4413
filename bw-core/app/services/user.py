from sqlmodel import Session, select
from app.entities.user import User
from fastapi import HTTPException
from datetime import datetime
from app.entities.bid import Bid
from app.entities.auction import Auction

from app.services.security import hash_password, verify_password
import re


def get_all_users(db: Session):
    statement = select(User)
    results = db.exec(statement)
    return results.all()

def get_user_by_id(db: Session, user_id: int):
    return db.get(User, user_id)

def get_user_by_email(db: Session, email: str):
    statement = select(User).where(User.email == email)
    return db.exec(statement).first()

def get_user_by_username(db: Session, username: str):
    statement = select(User).where(User.username == username)
    return db.exec(statement).first()
    

def create_user(db: Session, user):
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def search_users_in_db(db: Session, query: str):
    statement = select(User).where(
        (User.username.ilike(f"%{query}%")) | (User.email.ilike(f"%{query}%"))
    )
    results = db.exec(statement)
    return results.all()

def has_active_bids(db: Session, user_id: int) -> bool:
    """Check if a user has active bids in auctions that haven't ended yet."""
    statement = (
        select(Bid)
        .join(Auction, Auction.id == Bid.auction_id)
        .where(Bid.user_id == user_id, Auction.end_date > datetime.utcnow())
    )
    return db.exec(statement).first() is not None  # Returns True if any active bids exist    
    

def is_strong_password(password: str) -> bool:
    """Check if password is strong (8+ characters, at least one number and one special character)."""
    return bool(re.match(r'^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$', password))

def create_user_in_db(db: Session, user):
    # Check for duplicate username/email
      # Convert username and email to lowercase to prevent duplicates
    normalized_username = user.username.lower()
    normalized_email = user.email.lower()


    if get_user_by_username(db, normalized_username):
        raise HTTPException(status_code=400, detail="Username already registered")
    if get_user_by_email(db, normalized_email):
        raise HTTPException(status_code=400, detail="Email already registered")

    # Enforce strong password
    if not is_strong_password(user.password):
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters long, include a number and a special character.")

    # Hash password before storing it
    hashed_password = hash_password(user.password)

    db_user = User(
        username=user.username.lower(),
        email=user.email.lower(),
        password=hashed_password,
        is_active=True,
        is_admin=False,
        role=user.role,
        street=user.street,
        city=user.city,
        country=user.country,
        postal_code=user.postal_code
    )
    return create_user(db, db_user)


def get_user_role(db: Session, user_id: int):
    user = db.get(User, user_id)
    if user:
        return user.role
    return None

