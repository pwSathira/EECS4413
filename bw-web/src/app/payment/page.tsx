"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { getAuctionWinnerAndItem } from "@/api/payment-api";
import { getUserById } from "@/api/user-api";

function PaymentPageContent() {
  const searchParams = useSearchParams(); // Hook to get query parameters

  interface ResponseData {
    username: string;
    streetAddress: string;
    city: string;
    country: string;
    postalCode: string;
    totalCost: string;
  }

  interface FormErrors {
    cardNumber?: string;
    nameOnCard?: string;
    expirationDate?: string;
    securityCode?: string;
  }

  const [responseData, setResponseData] = useState<ResponseData | null>(null); // State to store GET request data
  const [formData, setFormData] = useState({
    cardNumber: "",
    nameOnCard: "",
    expirationDate: "",
    securityCode: "",
  });
  const [errors, setErrors] = useState<FormErrors>({}); // State for validation errors

  // Extract the query parameter
  const dataFromQuery = searchParams.get("data"); // Replace "data" with your query parameter key

  // Fetch data when the page loads
  useEffect(() => {
    if (!dataFromQuery) return; // Ensure the query parameter exists

    const fetchData = async () => {
      try {
        // Fetch WinnerIdAndItemPrice
        const { userId, currentHighestBid } = await getAuctionWinnerAndItem(Number(dataFromQuery));

        if (!userId) {
          toast.error("No winner found for this auction.");
          return;
        }

        // Fetch user details using userId
        const user = await getUserById(userId);

        // Set response data
        setResponseData({
          username: user.username || "N/A",
          streetAddress: user.street || "N/A",
          city: user.city || "N/A",
          country: user.country || "N/A",
          postalCode: user.postal_code || "N/A",
          totalCost: currentHighestBid?.toString() || "N/A",
        });
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to fetch data");
      }
    };

    fetchData();
  }, [dataFromQuery]); // Re-run if the query parameter changes

  // Client-side validation
  const validateForm = () => {
    const newErrors: FormErrors = {}; // Using the defined error type here
    if (!formData.cardNumber.match(/^\d{16}$/)) {
      newErrors.cardNumber = "Card number must be 16 digits.";
    }
    if (!formData.nameOnCard.trim()) {
      newErrors.nameOnCard = "Name on card is required.";
    }
    if (!formData.expirationDate.match(/^(0[1-9]|1[0-2])\/\d{2}$/)) {
      newErrors.expirationDate = "Expiration date must be in MM/YY format.";
    }
    if (!formData.securityCode.match(/^\d{3}$/)) {
      newErrors.securityCode = "Security code must be 3 digits.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please fix the errors in the form.");
      return;
    }
    toast.success("Payment completed successfully!");
    // Add logic to handle payment submission
  };

  if (!responseData) {
    return <div>Loading...</div>; // Show a loading state while waiting for the GET request
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold text-center mb-8">BidWize</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Section: Winning Bidder */}
        <Card>
          <CardHeader>
            <CardTitle>Winning Bidder</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <Label>Username</Label>
                <span>{responseData.username || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <Label>Street Address</Label>
                <span>{responseData.streetAddress || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <Label>City</Label>
                <span>{responseData.city || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <Label>Country</Label>
                <span>{responseData.country || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <Label>Postal Code</Label>
                <span>{responseData.postalCode || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <Label>Total Cost</Label>
                <span>{responseData.totalCost || "N/A"}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Section: Credit Card */}
        <Card>
          <CardHeader>
            <CardTitle>Credit Card</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Input
                  id="cardNumber"
                  type="text"
                  placeholder="Card Number"
                  value={formData.cardNumber}
                  onChange={(e) => setFormData({ ...formData, cardNumber: e.target.value })}
                />
                {errors.cardNumber && <p className="text-red-500 text-sm">{errors.cardNumber}</p>}
              </div>
              <div className="space-y-2">
                <Input
                  id="nameOnCard"
                  type="text"
                  placeholder="Name on Card"
                  value={formData.nameOnCard}
                  onChange={(e) => setFormData({ ...formData, nameOnCard: e.target.value })}
                />
                {errors.nameOnCard && <p className="text-red-500 text-sm">{errors.nameOnCard}</p>}
              </div>
              <div className="space-y-2">
                <Input
                  id="expirationDate"
                  type="text"
                  placeholder="MM/YY"
                  value={formData.expirationDate}
                  onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                />
                {errors.expirationDate && <p className="text-red-500 text-sm">{errors.expirationDate}</p>}
              </div>
              <div className="space-y-2">
                <Input
                  id="securityCode"
                  type="text"
                  placeholder="Security Code"
                  value={formData.securityCode}
                  onChange={(e) => setFormData({ ...formData, securityCode: e.target.value })}
                />
                {errors.securityCode && <p className="text-red-500 text-sm">{errors.securityCode}</p>}
              </div>
              <Button type="submit" className="w-full">
                Complete Payment
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentPageContent />
    </Suspense>
  );
}