import { NextResponse } from "next/server";
import axios from "axios";

const API_BASE_URL = "http://localhost:8000/api/v1";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/orders/auction/add/${params.id}`,
      {
        total_paid: 0, // This will be set by the backend based on the winning bid
        item_id: 0, // This will be set by the backend based on the auction
      }
    );
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error("Error confirming purchase:", error);
    const errorMessage = error.response?.data?.detail || "Failed to confirm purchase";
    return NextResponse.json(
      { error: errorMessage },
      { status: error.response?.status || 500 }
    );
  }
} 