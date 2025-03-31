import { NextResponse } from "next/server";
import axios from "axios";

const API_BASE_URL = "http://localhost:8000/api/v1";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const response = await axios.post(`${API_BASE_URL}/auctions/`, body);
    return NextResponse.json(response.data);
  } catch (error) {
    console.error("Error creating auction:", error);
    return NextResponse.json(
      { error: "Failed to create auction" },
      { status: 500 }
    );
  }
} 