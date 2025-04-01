import { NextResponse } from "next/server";
import axios from "axios";

const API_BASE_URL = "http://localhost:8000/api/v1";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/auctions/${params.id}/end`
    );
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error("Error ending auction:", error);
    // Transform FastAPI error response to match our frontend expectations
    const errorMessage = error.response?.data?.detail || "Failed to end auction";
    return NextResponse.json(
      { error: errorMessage },
      { status: error.response?.status || 500 }
    );
  }
} 