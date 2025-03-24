from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List
from fastapi import BackgroundTasks
from datetime import datetime, timedelta
from ..entities.bid import Bid
from ..entities.item import Item
from ..entities.user import User
from ..services.db import get_db
from ..services.auction_service import (
    determine_winner,
    process_ended_auctions,
    get_auction_with_winner
)
from ..entities.auction import Auction, AuctionCreate, AuctionRead, AuctionUpdate
from ..services.user import get_user_by_id, get_user_role

router = APIRouter(
    prefix="/auctions",
    tags=["auctions"],
)


@router.post("/", response_model=AuctionRead, status_code=status.HTTP_201_CREATED)
def create_auction(auction: AuctionCreate, db: Session = Depends(get_db)):
    if auction.start_date >= auction.end_date:
        raise HTTPException(
            status_code=400, detail="End date must be after start date"
        )
    if get_user_by_id(db, auction.user_id) is None:
        raise HTTPException(status_code=400, detail="User not found")
    if get_user_role(db, auction.user_id) != "seller":
        raise HTTPException(status_code=400, detail="User must be a seller")
    db_auction = Auction.model_validate(auction)
    db.add(db_auction)
    db.commit()
    db.refresh(db_auction)
    return db_auction


@router.get("/", response_model=List[AuctionRead])
def read_auctions(
    skip: int = 0, limit: int = 100, active_only: bool = False, db: Session = Depends(get_db)
):
    query = select(Auction)
    if active_only:
        query = query.where(Auction.is_active == True)
    
    auctions = db.exec(query.offset(skip).limit(limit)).all()
    return auctions


@router.get("/{auction_id}", response_model=AuctionRead)
def read_auction(auction_id: int, db: Session = Depends(get_db)):
    auction = db.get(Auction, auction_id)
    if not auction:
        raise HTTPException(status_code=404, detail="Auction not found")
    return auction


@router.patch("/{auction_id}", response_model=AuctionRead)
def update_auction(
    auction_id: int, auction_update: AuctionUpdate, db: Session = Depends(get_db)
):
    db_auction = db.get(Auction, auction_id)
    if not db_auction:
        raise HTTPException(status_code=404, detail="Auction not found")
    
    auction_data = auction_update.model_dump(exclude_unset=True)
    for key, value in auction_data.items():
        setattr(db_auction, key, value)
    
    db.add(db_auction)
    db.commit()
    db.refresh(db_auction)
    return db_auction


@router.delete("/{auction_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_auction(auction_id: int, db: Session = Depends(get_db)):
    db_auction = db.get(Auction, auction_id)
    if not db_auction:
        raise HTTPException(status_code=404, detail="Auction not found")
    
    db.delete(db_auction)
    db.commit()
    return None


@router.get("/{auction_id}/status", response_model=dict)
def get_auction_status(auction_id: int, db: Session = Depends(get_db)):
    """Get detailed status of an auction, including winner information if ended"""
    result = get_auction_with_winner(db, auction_id)
    if not result:
        raise HTTPException(status_code=404, detail="Auction not found")
    return result


@router.post("/{auction_id}/end", response_model=dict)
def end_auction_manually(auction_id: int, db: Session = Depends(get_db)):
    """Manually end an auction and determine the winner"""
    auction = db.get(Auction, auction_id)
    if not auction:
        raise HTTPException(status_code=404, detail="Auction not found")
    
    if not auction.is_active:
        raise HTTPException(status_code=400, detail="Auction is already ended")
    
    winner = determine_winner(db, auction_id)
    
    if winner:
        return winner
    else:
        return {"message": "Auction ended, no bids were placed"}
    
@router.post("/process-ended", response_model=dict)
def process_ended_auctions_route(background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
        """Process all auctions that have ended"""
        count = process_ended_auctions(db)
        return {"message": f"Processed {count} ended auctions"}


@router.post("/create-sample", response_model=dict, tags=["development"])
def create_sample_auction(db: Session = Depends(get_db)):
    """Creates a sample ended auction with a seller, item, and multiple bids for testing"""
    
    # Create a seller
    seller = User(
        username="sample_seller",
        email="seller@example.com",
        password="sample_password",
        is_active=True,
        is_admin=False,
        role="seller",
        street="123 Seller St",
        city="Seller City",
        country="Seller Country",
        postal_code="12345"
    )
    db.add(seller)
    db.flush()

    # Create a bidder
    bidder = User(
        username="sample_bidder",
        email="bidder@example.com",
        password="sample_password",
        is_active=True,
        is_admin=False,
        role="buyer",
        street="456 Bidder St",
        city="Bidder City",
        country="Bidder Country",
        postal_code="67890"
    )
    db.add(bidder)
    db.flush()
    
    # Create an item with a non-null initial_price value
    item = Item(
        name="Sample Item",
        description="A test item for the sample auction",
        initial_price=100.0,
        user_id=seller.id,
        image_url="https://via.placeholder.com/150",
    )
    db.add(item)
    db.flush()

    # Create an auction that ended 1 hour ago
    end_time = datetime.utcnow() - timedelta(hours=1)
    start_time = end_time - timedelta(days=1)
    
    auction = Auction(
        start_date=start_time,
        end_date=end_time,
        min_bid_increment=10.0,
        item_id=item.id,
        user_id=seller.id,
        is_active=False,  # Auction ended
        winning_bid_id=None,
    )
    db.add(auction)
    db.flush()

    # Create some bids with the required bidder_name and bidder_email
    bid1 = Bid(
        amount=120.0,
        bidder_name=bidder.username,
        bidder_email=bidder.email,
        user_id=bidder.id,
        auction_id=auction.id,
        created_at=start_time + timedelta(hours=2)
    )
    db.add(bid1)

    winning_bid = Bid(
        amount=150.0,
        bidder_name=bidder.username,
        bidder_email=bidder.email,
        user_id=bidder.id,
        auction_id=auction.id,
        created_at=start_time + timedelta(hours=4)
    )
    db.add(winning_bid)
    db.flush()

    # Set the winning bid for the auction
    auction.winning_bid_id = winning_bid.id
    db.commit()

    return {
        "message": "Sample auction created successfully",
        "auction_id": auction.id,
        "seller_id": seller.id,
        "bidder_id": bidder.id,
        "winning_bid_id": winning_bid.id,
        "item_id": item.id
    }