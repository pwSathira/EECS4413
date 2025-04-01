from sqlalchemy.orm import Session
from app.entities.order import Order as OrderModel
from app.services.auction_service import get_auction_with_winner
from app.services.user import get_user_by_id
from fastapi import HTTPException

class OrderService:
    @staticmethod
    def get_order(db: Session, auction_id: int) -> OrderModel:
        # Get the auction details including the winning user ID
        auction_data = get_auction_with_winner(db, auction_id)
        if not auction_data or "winner" not in auction_data:
            raise HTTPException(status_code=404, detail="No winner found for this auction")

        winner_user_id = auction_data["winner"]["user_id"]

        # Retrieve the user information based on the winning user ID
        user = get_user_by_id(db, winner_user_id)
        if not user:
            raise HTTPException(status_code=404, detail="Winner user not found")

        # Retrieve the order related to this auction
        order = (
            db.query(OrderModel)
            .filter(OrderModel.item_id == auction_data["item"]["id"])
            .first()
        )
        
        if not order:
            raise HTTPException(status_code=404, detail="Order not found for this auction's item")

        # Return the formatted order details
        order_response = OrderModel(
            user_id=user.id, #getting user id 
            user_name=user.username,
            street_address=user.street,
            phone_number=order.phone_number,
            province=order.province,
            country=user.country,
            postal_code=user.postal_code,
            total_paid=order.total_paid,
            item_id=order.item_id
        )

        return order_response
    
    
    # @staticmethod
    # def add_order(db: Session, order_data: OrderRequest):
    #     new_order = OrderModel(
    #         user_name=order_data.user_name,
    #         street_address=order_data.street_address,
    #         phone_number=order_data.phone_number,
    #         province=order_data.province,
    #         country=order_data.country,
    #         postal_code=order_data.postal_code,
    #         total_paid=order_data.total_paid,
    #         item_id=order_data.item_id
    #     )

    #     db.add(new_order)
    #     db.commit()
    #     db.refresh(new_order)

    #     return {"message": "Order successfully added", "order_id": new_order.id}
    
    @staticmethod
    def add_order_from_auction(db: Session, auction_id: int, total_paid: float, item_id: int):
        # Get auction details with winner info
        auction_details = get_auction_with_winner(db, auction_id)
        if not auction_details or "winner" not in auction_details:
            raise HTTPException(status_code=404, detail="Auction winner not found")

        winner_id = auction_details["winner"]["user_id"]

        # Get user details for the winner
        winner_info = get_user_by_id(db, winner_id)
        if not winner_info:
            raise HTTPException(status_code=404, detail="Winner details not found")

        # Create and add the order
        new_order = OrderModel(
            user_id=winner_info.id,
            user_name=winner_info.username,
            street_address=winner_info.street,
            phone_number=getattr(winner_info, 'phone_number', "N/A"),
            province=winner_info.city,  
            country=winner_info.country,
            postal_code=winner_info.postal_code,
            total_paid=total_paid,
            item_id=item_id,
            auction_id=auction_id  # Add auction_id to track which auction this order is for
        )

        db.add(new_order)
        db.commit()
        db.refresh(new_order)

        # Fetch the complete order with item relationship
        order_with_item = (
            db.query(OrderModel)
            .filter(OrderModel.id == new_order.id)
            .join(OrderModel.item)
            .first()
        )

        return {
            "message": "Order successfully added",
            "order_id": order_with_item.id,
            "item": {
                "id": order_with_item.item.id,
                "name": order_with_item.item.name,
                "description": order_with_item.item.description,
                "initial_price": order_with_item.item.initial_price,
                "image_url": order_with_item.item.image_url,
                "created_at": order_with_item.item.created_at
            }
        }
