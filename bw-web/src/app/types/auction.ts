export interface Auction {
    id: number;
    start_date: string;
    end_date: string;
    min_bid_increment: number;
    item_id: number;
    user_id: number;
    is_active: boolean;
    created_at: string;
    winning_bid_id?: number;
  }
  
  export interface Item {
    id: number;
    name: string;
    description: string;
    initial_price: number;
    image_url: string;
    created_at: string;
  }
  
  export interface AuctionWithItem extends Auction {
    item: Item;
  }