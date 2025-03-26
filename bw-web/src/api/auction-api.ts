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
          return {
            ...auction,
            item: itemResponse.data,
          };
        })
      );
  
      return auctionsWithItems;
    } catch (error) {
      console.error("Error fetching auctions:", error);
      throw error;
    }
  };
  