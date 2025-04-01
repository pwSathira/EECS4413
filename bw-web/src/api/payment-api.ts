import axios from "axios";
import {AuctionWithWinner, WinnerIdAndItemPrice} from "@/types/auction";
/**
 * Calls the backend API to get the auction status for a given auction ID.
 * 
 * @param auctionId - The ID of the auction to retrieve the status for.
 * @returns A promise that resolves to the auction status data.
 * @throws An error if the API call fails.
 */

const API_BASE_URL = "http://localhost:8000/api/v1";

export async function getAuctionWinnerAndItem(auctionId: number): Promise<WinnerIdAndItemPrice> {
  try {
    const response = await axios.get<AuctionWithWinner>(`${API_BASE_URL}/auctions/${auctionId}/status`);
    const { winner, currentHighestBid } = response.data;
    return{
      currentHighestBid: currentHighestBid || 0,
      userId: winner ? winner.userId : null,
    };
  } catch (error) {
    console.error("Error fetching auction status:", error);
    throw error;
  }
}