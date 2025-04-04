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
    get_auction_with_winner,
    get_auction_with_latest_bid,
    get_auctions_by_seller,
    get_auctions_by_seller2
)
from ..entities.auction import Auction, AuctionCreate, AuctionRead, AuctionUpdate
from ..services.user import get_user_by_id, get_user_role, hash_password
from ..services.email_service import send_hi_email, send_auction_end_notification

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

@router.get("/startedby2", response_model=List[AuctionRead])
def get_auctions_started_by_seller2(seller_id: int, db: Session = Depends(get_db)):
    """
    Fetch all auctions started by the seller with the given seller_id.
    """
    if not seller_id:
        raise HTTPException(status_code=400, detail="Seller ID is required")
    
    auctions = get_auctions_by_seller(db, seller_id)
    if not auctions:
        raise HTTPException(status_code=404, detail="No auctions found for the given seller ID")
     
    return auctions

@router.get("/startedby", response_model=List[AuctionRead])
def get_auctions_started_by_seller(seller_id: int, db: Session = Depends(get_db)):
    """
    Fetch all auctions started by the seller with the given seller_id.
    """
    if not seller_id:
        raise HTTPException(status_code=400, detail="Seller ID is required")
    
    auctions = get_auctions_by_seller(db, seller_id)
    if not auctions:
        raise HTTPException(status_code=404, detail="No auctions found for the given seller ID")
    
    return auctions

@router.get("/{auction_id}", response_model=dict)
def read_auction(auction_id: int, db: Session = Depends(get_db)):
    result = get_auction_with_latest_bid(db, auction_id)
    if not result:
        raise HTTPException(status_code=404, detail="Auction not found")
    return result


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
    print(f"Attempting to end auction with ID: {auction_id}")  # Debug log
    
    auction = db.get(Auction, auction_id)
    if not auction:
        print(f"Auction {auction_id} not found in database")  # Debug log
        raise HTTPException(status_code=404, detail=f"Auction with ID {auction_id} not found")
    
    if not auction.is_active:
        print(f"Auction {auction_id} is already ended")  # Debug log
        raise HTTPException(status_code=400, detail="Auction is already ended")
    
    # Find the highest bid
    highest_bid = db.exec(
        select(Bid)
        .where(Bid.auction_id == auction_id)
        .order_by(Bid.amount.desc())
    ).first()
    
    # Update auction status
    auction.is_active = False
    if highest_bid:
        auction.winning_bid_id = highest_bid.id
        print(f"Setting winning bid {highest_bid.id} for auction {auction_id}")  # Debug log
        
        # Get the item details
        item = db.get(Item, auction.item_id)
        if not item:
            print(f"Item {auction.item_id} not found")  # Debug log
            raise HTTPException(status_code=404, detail="Item not found")
            
        # Get the winner and seller details
        winner = db.get(User, highest_bid.user_id)
        seller = db.get(User, auction.user_id)
        
        if not winner or not seller:
            print("Winner or seller not found")  # Debug log
            raise HTTPException(status_code=404, detail="Winner or seller not found")
            
        # Send email notifications
        try:
            email_response = send_auction_end_notification(
                winner_email=winner.email,
                seller_email=seller.email,
                item_name=item.name,
                winning_amount=highest_bid.amount
            )
            print("Email notifications sent:", email_response)  # Debug log
        except Exception as e:
            print(f"Failed to send email notifications: {str(e)}")  # Debug log
            # Don't raise the exception - we still want to end the auction even if email fails
    else:
        print(f"No bids found for auction {auction_id}")  # Debug log
    
    # Save the changes
    try:
        db.add(auction)
        db.commit()
        db.refresh(auction)
        print(f"Successfully ended auction {auction_id}")  # Debug log
    except Exception as e:
        print(f"Error saving auction {auction_id}: {str(e)}")  # Debug log
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error saving auction: {str(e)}")
    
    # Return winner info if there's a winner
    if highest_bid:
        return {
            "message": "Auction ended successfully",
            "auction_id": auction.id,
            "item_id": auction.item_id,
            "winning_bid_id": highest_bid.id,
            "winning_amount": highest_bid.amount
        }
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
            email=f"s{i}@test.com",
            password=hash_password("123"),
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
            email=f"b{i}@test.com",
            password=hash_password("123"),
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
            "image_url": "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=800&auto=format&fit=crop"
        },
        {
            "name": "Gaming Console",
            "description": "Latest generation gaming console, sealed in box",
            "initial_price": 400.0,
            "image_url": "https://images.unsplash.com/photo-1486401899868-0e435ed85128?q=80&w=800&auto=format&fit=crop"
        },
        {
            "name": "Antique Watch",
            "description": "1940s Swiss mechanical watch, recently serviced",
            "initial_price": 300.0,
            "image_url": "https://images.unsplash.com/photo-1524592094714-0f0654e20314?q=80&w=800&auto=format&fit=crop"
        },
        {
            "name": "Art Print",
            "description": "Limited edition print, signed by the artist",
            "initial_price": 200.0,
            "image_url": "https://picsum.photos/800/800"
        },
        {
            "name": "Collectible Cards",
            "description": "Complete set of rare trading cards",
            "initial_price": 150.0,
            "image_url": "https://picsum.photos/800/720"
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
        "item_id": items[0].id,  # Vintage Camera
        "user_id": sellers[0].id,
        "is_active": False
    })

    # Gaming Console - ending in 2 minutes
    console_end = now + timedelta(minutes=2)  # Changed to exactly 2 minutes    
    auctions_data.append({
        "start_date": now,  # Changed to start now instead of 1 day ago
        "end_date": console_end,
        "min_bid_increment": 20.0,
        "item_id": items[1].id,  # Gaming Console
        "user_id": sellers[1].id,
        "is_active": True
    })

    # Antique Watch - ending in 6 hours
    auctions_data.append({
        "start_date": now - timedelta(days=1),
        "end_date": now + timedelta(hours=6),
        "min_bid_increment": 15.0,
        "item_id": items[2].id,  # Antique Watch
        "user_id": sellers[1].id,
        "is_active": True
    })

    # Art Print - ending in 3 days
    auctions_data.append({
        "start_date": now - timedelta(hours=12),
        "end_date": now + timedelta(days=3),
        "min_bid_increment": 10.0,
        "item_id": items[3].id,  # Art Print
        "user_id": sellers[2].id,
        "is_active": True
    })

    # First Collectible Cards - future auction
    auctions_data.append({
        "start_date": now + timedelta(days=1),
        "end_date": now + timedelta(days=4),
        "min_bid_increment": 25.0,
        "item_id": items[4].id,  # Collectible Cards
        "user_id": sellers[0].id,
        "is_active": True
    })

    # Second Collectible Cards - ending in 2 days
    auctions_data.append({
        "start_date": now - timedelta(hours=6),
        "end_date": now + timedelta(days=2),
        "min_bid_increment": 30.0,
        "item_id": items[4].id,  # Collectible Cards
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
        # Bids for ended auction (Vintage Camera)
        {"auction_idx": 0, "amounts": [550.0, 600.0, 650.0]},
        # Bids for Gaming Console ending in 1 minute
        {"auction_idx": 1, "amounts": [450.0, 500.0]},
        # Bids for Antique Watch
        {"auction_idx": 2, "amounts": [350.0]},
        # Bids for Art Print
        {"auction_idx": 3, "amounts": [200.0]},
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

@router.post("/test/email", response_model=dict)
def test_email_service():
    """
    Test route to verify email service functionality.
    """
    try:
        response = send_hi_email()
        return {
            "message": "Test email sent successfully",
            "email_response": response
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error sending test email: {str(e)}"
        )
    

