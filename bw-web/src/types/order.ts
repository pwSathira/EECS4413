export interface Order {
  id: number;
  user_id: number;
  user_name: string;
  street_address: string;
  phone_number: string;
  province: string;
  country: string;
  postal_code: string;
  total_paid: number;
  item_id: number;
  auction_id: number;
  item: {
    id: number;
    name: string;
    description: string;
    initial_price: number;
    image_url: string;
    created_at: string;
  };
} 