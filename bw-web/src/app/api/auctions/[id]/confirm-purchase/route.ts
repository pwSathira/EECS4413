import { NextRequest, NextResponse } from "next/server";
import axios, { AxiosError } from "axios";

const API_BASE_URL = "http://localhost:8000/api/v1";

interface ErrorResponse {
  detail?: string;
}

type Params = Promise<{ id: string }>;

interface RequestBody {
  total_paid: number;
  item_id: number;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id } = await params;

    const requestBody: RequestBody = {
      total_paid: 0, // This will be set by the backend based on the winning bid
      item_id: 0, // This will be set by the backend based on the auction
    };

    const response = await axios.post(
      `${API_BASE_URL}/orders/auction/add/${id}`,
      requestBody
    );
    return NextResponse.json(response.data);
  } catch (error) {
    console.error("Error confirming purchase:", error);
    const axiosError = error as AxiosError<ErrorResponse>;
    const errorMessage =
      axiosError.response?.data?.detail || "Failed to confirm purchase";
    return NextResponse.json(
      { error: errorMessage },
      { status: axiosError.response?.status || 500 }
    );
  }
}
