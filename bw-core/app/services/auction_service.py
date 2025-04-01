# services/auction_service.py
from sqlmodel import Session, select
from datetime import datetime
from ..entities.auction import Auction
from ..entities.bid import Bid
from typing import Dict, Any, Optional


def check_auction_status(auction: Auction) -> bool:
    """Check if an auction should be closed based on end_date"""
    current_time = datetime.utcnow()
    return auction.end_date <= current_time


def determine_winner(db: Session, auction_id: int) -> Optional[Dict[str, Any]]:
    """Determine the winner of an auction and update the auction record"""
    auction = db.get(Auction, auction_id)
    if not auction:
        return None
    
    # If auction is already processed (not active) and has a winner
    if not auction.is_active and auction.winning_bid_id:
        winner_bid = db.get(Bid, auction.winning_bid_id)
        if winner_bid:
            return {
                "auction_id": auction.id,
                "item_id": auction.item_id,
                "winning_bid_id": winner_bid.id,
                "winning_amount": winner_bid.amount,
                "winner_name": winner_bid.bidder_name,
                "winner_email": winner_bid.bidder_email
            }
    
    # If the auction isn't over yet, check if it should be
    if auction.is_active and check_auction_status(auction):
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
            
        db.add(auction)
        db.commit()
        db.refresh(auction)
        
        # Return winner info if there's a winner
        if highest_bid:
            return {
                "auction_id": auction.id,
                "item_id": auction.item_id,
                "winning_bid_id": highest_bid.id,
                "winning_amount": highest_bid.amount,
                "winner_name": highest_bid.bidder_name,
                "winner_email": highest_bid.bidder_email
            }
    
    return None


def get_auction_with_winner(db: Session, auction_id: int) -> Dict[str, Any]:
    """Get detailed auction info including winner details if available"""
    auction = db.get(Auction, auction_id)
    if not auction:
        return None
    
    # Check if auction should be ended but hasn't been processed yet
    if auction.is_active and check_auction_status(auction):
        determine_winner(db, auction_id)
        db.refresh(auction)
    
    # Build basic auction info
    result = {
        "id": auction.id,
        "start_date": auction.start_date,
        "end_date": auction.end_date,
        "is_active": auction.is_active,
        "has_ended": auction.end_date <= datetime.utcnow(),
        "item": {
            "id": auction.item.id,
            "name": auction.item.name,
            "initial_price": auction.item.initial_price
        }
    }
    
    # Add winner info if available
    if auction.winning_bid_id:
        winning_bid = db.get(Bid, auction.winning_bid_id)
        if winning_bid:
            result["winner"] = {
                "bid_id": winning_bid.id,
                "user_id": winning_bid.user_id,
                "amount": winning_bid.amount,
            }
    
    return result


def process_ended_auctions(db: Session) -> int:
    """Find all auctions that have ended but are still active and process them"""
    current_time = datetime.utcnow()
    
    # Find auctions that have ended but are still marked as active
    query = select(Auction).where(
        Auction.is_active == True,
        Auction.end_date <= current_time
    )
    
    ended_auctions = db.exec(query).all()
    processed_count = 0
    
    for auction in ended_auctions:
        # Mark auction as inactive regardless of whether there's a winner
        auction.is_active = False
        
        # Try to determine winner
        winner_result = determine_winner(db, auction.id)
        if winner_result:
            processed_count += 1
        
        # Commit changes even if no winner was found
        db.add(auction)
        db.commit()
        db.refresh(auction)
    
    return processed_count


def get_latest_bid(db: Session, auction_id: int) -> Optional[Bid]:
    """Get the latest bid for an auction"""
    query = select(Bid).where(Bid.auction_id == auction_id).order_by(Bid.amount.desc())
    return db.exec(query).first()


def get_auction_with_latest_bid(db: Session, auction_id: int) -> Optional[dict]:
    """Get auction details with the latest bid information"""
    auction = db.get(Auction, auction_id)
    if not auction:
        return None
    
    # Get all bids for this auction
    bids_query = select(Bid).where(Bid.auction_id == auction_id).order_by(Bid.amount.desc())
    all_bids = db.exec(bids_query).all()
    
    latest_bid = all_bids[0] if all_bids else None
    current_price = auction.item.initial_price
    
    if latest_bid:
        current_price = latest_bid.amount
    
    # Convert bids to dict format
    bids_dict = [{
        "id": bid.id,
        "amount": bid.amount,
        "user_id": bid.user_id,
        "auction_id": bid.auction_id,
        "created_at": bid.created_at
    } for bid in all_bids]
    
    # Convert latest_bid to dict if it exists
    latest_bid_dict = None
    if latest_bid:
        latest_bid_dict = {
            "id": latest_bid.id,
            "amount": latest_bid.amount,
            "user_id": latest_bid.user_id,
            "auction_id": latest_bid.auction_id,
            "created_at": latest_bid.created_at
        }
    
    return {
        "id": auction.id,
        "start_date": auction.start_date,
        "end_date": auction.end_date,
        "min_bid_increment": auction.min_bid_increment,
        "item_id": auction.item_id,
        "user_id": auction.user_id,
        "is_active": auction.is_active,
        "created_at": auction.created_at,
        "winning_bid_id": auction.winning_bid_id,
        "current_price": current_price,
        "latest_bid": latest_bid_dict,
        "bids": bids_dict,
        "item": {
            "id": auction.item.id,
            "name": auction.item.name,
            "description": auction.item.description,
            "initial_price": auction.item.initial_price,
            "image_url": auction.item.image_url,
            "created_at": auction.item.created_at
        }
    }
