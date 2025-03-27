"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AuctionWithItem } from "@/types/auction";
import { fetchAuctionById, createBid } from "@/api/auction-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/home-page/Header";
import { Footer } from "@/components/home-page/Footer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Image from "next/image";

export default function AuctionPage() {
  const params = useParams();
  const [auction, setAuction] = useState<AuctionWithItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bidAmount, setBidAmount] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadAuction = async () => {
    try {
      const id = parseInt(params.id as string);
      if (isNaN(id)) {
        throw new Error("Invalid auction ID");
      }
      const data = await fetchAuctionById(id);
      setAuction(data);
      // Set initial bid amount to current price + minimum increment
      const nextBidAmount = data.current_price + data.min_bid_increment;
      setBidAmount(nextBidAmount.toString());
    } catch (err) {
      setError("Failed to load auction details");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuction();
  }, [params.id]);

  const handleBidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auction) return;

    setIsSubmitting(true);
    try {
      const amount = parseFloat(bidAmount);
      if (isNaN(amount)) {
        toast.error("Please enter a valid bid amount");
        return;
      }

      // Temporarily using a random user ID (4)
      await createBid({
        amount,
        user_id: 4,
        auction_id: auction.id,
      });

      toast.success("Bid placed successfully!");
      // Refresh auction data
      await loadAuction();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to place bid");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="container mx-auto py-8">Loading auction details...</div>;
  }

  if (error || !auction) {
    return <div className="container mx-auto py-8 text-red-500">{error || "Auction not found"}</div>;
  }

  const timeLeft = new Date(auction.end_date).getTime() - new Date().getTime();
  const daysLeft = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
  const hoursLeft = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

  return (
    <div className="container mx-auto py-8">
      <Header />
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="aspect-square relative">
            <Image
              src={auction.item.image_url}
              alt={auction.item.name}
              fill
              className="object-cover rounded-lg"
            />
          </div>
          
          <div>
            <h1 className="text-3xl font-bold mb-2">{auction.item.name}</h1>
            <p className="text-muted-foreground mb-6">{auction.item.description}</p>
            
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Auction Details</CardTitle>
                <CardDescription>Current status and bidding information</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Current Price</p>
                    <p className="text-2xl font-bold">${auction.current_price.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Minimum Bid Increment</p>
                    <p className="text-xl font-semibold">${auction.min_bid_increment.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Time Remaining</p>
                    <p className="text-xl font-semibold">
                      {`${daysLeft}d ${hoursLeft}h ${minutesLeft}m`}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Start Date</p>
                    <p>{new Date(auction.start_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">End Date</p>
                    <p>{new Date(auction.end_date).toLocaleDateString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Place a Bid</CardTitle>
                <CardDescription>Enter your bid amount</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleBidSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="bidAmount">Bid Amount ($)</Label>
                    <Input
                      id="bidAmount"
                      type="number"
                      min={auction.current_price + auction.min_bid_increment}
                      step={auction.min_bid_increment}
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      required
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    size="lg"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Placing Bid..." : "Place Bid"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
} 