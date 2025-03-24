from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List

from ..services.db import get_db
from ..entities.bid import Bid, BidCreate, BidRead, BidUpdate
from ..entities.auction import Auction
from ..services.user import get_user_by_id, get_user_role

router = APIRouter(
    prefix="/bids",
    tags=["bids"],
)


@router.post("/", response_model=BidRead, status_code=status.HTTP_201_CREATED)
def create_bid(bid: BidCreate, db: Session = Depends(get_db)):
    # Check if auction exists and is active
    auction = db.get(Auction, bid.auction_id)
    if not auction:
        raise HTTPException(status_code=404, detail="Auction not found")
    if not auction.is_active:
        raise HTTPException(status_code=400, detail="Auction is not active")
    if get_user_by_id(db, bid.user_id) is None:
        raise HTTPException(status_code=400, detail="User not found")
    if get_user_role(db, bid.user_id) != "buyer":
        raise HTTPException(status_code=400, detail="User must be a buyer")
    
    # Find the highest bid for this auction
    highest_bid_query = select(Bid).where(Bid.auction_id == bid.auction_id).order_by(Bid.amount.desc())
    highest_bid = db.exec(highest_bid_query).first()
    
    # Check if the new bid is high enough
    min_bid = auction.item.initial_price
    if highest_bid:
        min_bid = highest_bid.amount + auction.min_bid_increment
    
    if bid.amount < min_bid:
        raise HTTPException(
            status_code=400, 
            detail=f"Bid must be at least {min_bid}"
        )
    
    # Create the bid
    db_bid = Bid.model_validate(bid)
    db.add(db_bid)
    db.commit()
    db.refresh(db_bid)
    return db_bid


@router.get("/", response_model=List[BidRead])
def read_bids(
    skip: int = 0, limit: int = 100, auction_id: int = None, db: Session = Depends(get_db)
):
    query = select(Bid)
    if auction_id:
        query = query.where(Bid.auction_id == auction_id)
    
    bids = db.exec(query.order_by(Bid.created_at.desc()).offset(skip).limit(limit)).all()
    return bids


@router.get("/{bid_id}", response_model=BidRead)
def read_bid(bid_id: int, db: Session = Depends(get_db)):
    bid = db.get(Bid, bid_id)
    if not bid:
        raise HTTPException(status_code=404, detail="Bid not found")
    return bid


@router.patch("/{bid_id}", response_model=BidRead)
def update_bid(
    bid_id: int, bid_update: BidUpdate, db: Session = Depends(get_db)
):
    db_bid = db.get(Bid, bid_id)
    if not db_bid:
        raise HTTPException(status_code=404, detail="Bid not found")
    
    bid_data = bid_update.dict(exclude_unset=True)
    for key, value in bid_data.items():
        setattr(db_bid, key, value)
    
    db.add(db_bid)
    db.commit()
    db.refresh(db_bid)
    return db_bid


@router.delete("/{bid_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_bid(bid_id: int, db: Session = Depends(get_db)):
    db_bid = db.get(Bid, bid_id)
    if not db_bid:
        raise HTTPException(status_code=404, detail="Bid not found")
    
    db.delete(db_bid)
    db.commit()
    return None
