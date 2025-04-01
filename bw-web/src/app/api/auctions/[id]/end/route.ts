import { NextRequest, NextResponse } from "next/server";
import axios, { AxiosError } from "axios";

const API_BASE_URL = "http://bidwize-core:8000/api/v1";

interface ErrorResponse {
  detail?: string;
}

type Params = Promise<{ id: string }>;

export async function POST(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id } = await params;

    const response = await axios.post(
      `${API_BASE_URL}/auctions/${id}/end`
    );
    return NextResponse.json(response.data);
  } catch (error) {
    console.error("Error ending auction:", error);
    const axiosError = error as AxiosError<ErrorResponse>;
    const errorMessage = axiosError.response?.data?.detail || "Failed to end auction";
    return NextResponse.json(
      { error: errorMessage },
      { status: axiosError.response?.status || 500 }
    );
  }
} 