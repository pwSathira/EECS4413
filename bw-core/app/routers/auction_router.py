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
    """Creates multiple sample auctions with sellers, items, and bids for testing"""
    
    # Create sellers
    sellers = [
        User(
            username=f"seller_{i}",
            email=f"seller{i}@example.com",
            password="sample_password",
            is_active=True,
            is_admin=False,
            role="seller",
            street=f"{i}23 Seller St",
            city="Seller City",
            country="Seller Country",
            postal_code=f"1234{i}"
        ) for i in range(1, 4)
    ]
    for seller in sellers:
        db.add(seller)
    db.flush()

    # Create bidders
    bidders = [
        User(
            username=f"bidder_{i}",
            email=f"bidder{i}@example.com",
            password="sample_password",
            is_active=True,
            is_admin=False,
            role="buyer",
            street=f"{i}56 Bidder St",
            city="Bidder City",
            country="Bidder Country",
            postal_code=f"5678{i}"
        ) for i in range(1, 4)
    ]
    for bidder in bidders:
        db.add(bidder)
    db.flush()

    # Sample items data
    items_data = [
        {
            "name": "Vintage Camera",
            "description": "A rare 1960s Leica M3 in excellent condition",
            "initial_price": 500.0,
            "image_url": "https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-image_large.png?v=1530129081"
        },
        {
            "name": "Gaming Console",
            "description": "Latest generation gaming console, sealed in box",
            "initial_price": 400.0,
            "image_url": "https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-image_large.png?v=1530129081"
        },
        {
            "name": "Antique Watch",
            "description": "1940s Swiss mechanical watch, recently serviced",
            "initial_price": 300.0,
            "image_url": "https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-image_large.png?v=1530129081"
        },
        {
            "name": "Art Print",
            "description": "Limited edition print, signed by the artist",
            "initial_price": 200.0,
            "image_url": "https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-image_large.png?v=1530129081"
        },
        {
            "name": "Collectible Cards",
            "description": "Complete set of rare trading cards",
            "initial_price": 150.0,
            "image_url": "https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-image_large.png?v=1530129081"
        }
    ]


    # Create items
    items = []
    for i, item_data in enumerate(items_data):
        item = Item(
            **item_data,
            user_id=sellers[i % len(sellers)].id
        )
        db.add(item)
        items.append(item)
    db.flush()

    # Create auctions with different states
    now = datetime.utcnow()
    auctions_data = []
    
    # Ended auction with winner
    auctions_data.append({
        "start_date": now - timedelta(days=2),
        "end_date": now - timedelta(hours=1),
        "min_bid_increment": 10.0,
        "item_id": items[0].id,
        "user_id": sellers[0].id,
        "is_active": False
    })

    # Active auction ending soon
    auctions_data.append({
        "start_date": now - timedelta(days=1),
        "end_date": now + timedelta(hours=2),
        "min_bid_increment": 20.0,
        "item_id": items[1].id,
        "user_id": sellers[1].id,
        "is_active": True
    })

    # Active auction with plenty of time
    auctions_data.append({
        "start_date": now - timedelta(hours=12),
        "end_date": now + timedelta(days=3),
        "min_bid_increment": 15.0,
        "item_id": items[2].id,
        "user_id": sellers[2].id,
        "is_active": True
    })

    # Future auction
    auctions_data.append({
        "start_date": now + timedelta(days=1),
        "end_date": now + timedelta(days=4),
        "min_bid_increment": 25.0,
        "item_id": items[3].id,
        "user_id": sellers[0].id,
        "is_active": True
    })

    # Active auction with no bids yet
    auctions_data.append({
        "start_date": now - timedelta(hours=6),
        "end_date": now + timedelta(days=2),
        "min_bid_increment": 30.0,
        "item_id": items[4].id,
        "user_id": sellers[1].id,
        "is_active": True
    })

    created_auctions = []
    for auction_data in auctions_data:
        auction = Auction(**auction_data)
        db.add(auction)
        created_auctions.append(auction)
    db.flush()

    # Add bids to some auctions
    bids_data = [
        # Bids for ended auction
        {"auction_idx": 0, "amounts": [550.0, 600.0, 650.0]},
        # Bids for active auction ending soon
        {"auction_idx": 1, "amounts": [450.0, 500.0]},
        # Bids for active auction with plenty of time
        {"auction_idx": 2, "amounts": [350.0]},
    ]

    created_bids = []
    for bid_set in bids_data:
        auction = created_auctions[bid_set["auction_idx"]]
        for i, amount in enumerate(bid_set["amounts"]):
            bidder = bidders[i % len(bidders)]
            bid = Bid(
                amount=amount,
                user_id=bidder.id,
                auction_id=auction.id,
                created_at=auction.start_date + timedelta(hours=i+1)
            )
            db.add(bid)
            created_bids.append(bid)
    db.flush()

    # Set winning bid for ended auction
    ended_auction = created_auctions[0]
    ended_auction.winning_bid_id = created_bids[2].id  # Highest bid for first auction
    ended_auction.is_active = False

    db.commit()

    return {
        "message": "Sample auctions created successfully",
        "auctions_created": len(created_auctions),
        "items_created": len(items),
        "bids_created": len(created_bids),
        "sellers_created": len(sellers),
        "bidders_created": len(bidders)
    }