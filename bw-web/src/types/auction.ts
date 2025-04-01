export interface Auction {
    id: number;
    start_date: string;
    end_date: string;
    min_bid_increment: number;
    item_id: number;
    user_id: number;
    seller_id: number;
    is_active: boolean;
    created_at: string;
    winning_bid_id?: number;
    current_price: number;
    bids: {
      id: number;
      amount: number;
      user_id: number;
      auction_id: number;
      created_at: string;
    }[];
    latest_bid?: {
      id: number;
      amount: number;
      user_id: number;
      auction_id: number;
      created_at: string;
    };
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
    current_price: number;
    latest_bid?: {
      id: number;
      amount: number;
      user_id: number;
      auction_id: number;
      created_at: string;
    };
    bids: {
      id: number;
      amount: number;
      user_id: number;
      auction_id: number;
      created_at: string;
    }[];
  }
//for payment page
  export interface AuctionWithWinner {
    auctionId: number;
    itemName: string;
    itemDescription: string;
    itemImageUrl: string;
    startDate: string;
    endDate: string;
    isActive: boolean;
    minBidIncrement: number;
    currentHighestBid: number | null;
    winner?: {
      userId: number;
      username: string;
      email: string;
      winningBidAmount: number;
    } | null;
  }
//for payment page
  export interface WinnerIdAndItemPrice {
    currentHighestBid: number;
    userId: number | null;
  }