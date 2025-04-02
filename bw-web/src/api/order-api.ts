import axios from "axios";
import { Order } from "@/types/order";
import { Item } from "@/types/auction";

const API_BASE_URL = "http://localhost:8000/api/v1";

export const fetchUserOrders = async (userId: number): Promise<Order[]> => {
  try {
    const response = await axios.get<Order[]>(`${API_BASE_URL}/orders/user/${userId}`);
    
    // Fetch item details for each order
    const ordersWithItems = await Promise.all(
      response.data.map(async (order) => {
        const itemResponse = await axios.get<Item>(`${API_BASE_URL}/items/${order.item_id}`);
        return {
          ...order,
          item: itemResponse.data
        };
      })
    );

    return ordersWithItems;
  } catch (error) {
    console.error("Error fetching user orders:", error);
    throw error;
  }
};
