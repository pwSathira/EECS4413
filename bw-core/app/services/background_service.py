from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from sqlmodel import Session
from .db import engine
from .auction_service import process_ended_auctions

# Create a scheduler instance
scheduler = AsyncIOScheduler()

def process_ended_auctions_task():
    """Background task to process ended auctions"""
    with Session(engine) as db:
        count = process_ended_auctions(db)
        print(f"Processed {count} ended auctions")

def start_background_tasks():
    """Start all background tasks"""
    # Process ended auctions every 5 minutes
    scheduler.add_job(
        process_ended_auctions_task,
        trigger=IntervalTrigger(minutes=1),  # Changed to 1 minute for more frequent checks
        id='process_ended_auctions',
        name='Process ended auctions',
        replace_existing=True
    )
    
    # Start the scheduler
    scheduler.start()

def stop_background_tasks():
    """Stop all background tasks"""
    scheduler.shutdown() 