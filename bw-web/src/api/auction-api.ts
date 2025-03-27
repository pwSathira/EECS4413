import axios from "axios";
import { Auction, Item, AuctionWithItem } from "@/types/auction";

const API_BASE_URL = "http://localhost:8000/api/v1";

export const fetchAuctionsWithItems = async (): Promise<AuctionWithItem[]> => {
  try {
    const auctionsResponse = await axios.get<Auction[]>(
      `${API_BASE_URL}/auctions/?skip=0&limit=100&active_only=true`
    );

    const auctionsWithItems = await Promise.all(
      auctionsResponse.data.map(async (auction) => {
        const itemResponse = await axios.get<Item>(
          `${API_BASE_URL}/items/${auction.item_id}`
        );
        
        // Get the latest bid for this auction
        const bidsResponse = await axios.get(
          `${API_BASE_URL}/bids/?auction_id=${auction.id}&limit=1`
        );
        
        const latestBid = bidsResponse.data[0] || null;
        const currentPrice = latestBid ? latestBid.amount : itemResponse.data.initial_price;

        return {
          ...auction,
          item: itemResponse.data,
          current_price: currentPrice,
          latest_bid: latestBid
        };
      })
    );

    return auctionsWithItems;
  } catch (error) {
    console.error("Error fetching auctions:", error);
    throw error;
  }
};

export const fetchAuctionById = async (id: number): Promise<AuctionWithItem> => {
  try {
    const auctionResponse = await axios.get<Auction>(
      `${API_BASE_URL}/auctions/${id}`
    );
    
    const itemResponse = await axios.get<Item>(
      `${API_BASE_URL}/items/${auctionResponse.data.item_id}`
    );

    return {
      ...auctionResponse.data,
      item: itemResponse.data,
    };
  } catch (error) {
    console.error("Error fetching auction:", error);
    throw error;
  }
};

export interface BidCreate {
  amount: number;
  user_id: number;
  auction_id: number;
}

export const createBid = async (bid: BidCreate): Promise<void> => {
  try {
    await axios.post(`${API_BASE_URL}/bids/`, bid);
  } catch (error) {
    console.error("Error creating bid:", error);
    throw error;
  }
};
  