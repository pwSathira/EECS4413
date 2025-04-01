"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
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
import { AxiosError } from "axios";
import { useUser } from "@/contexts/UserContext";

export default function AuctionPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();
  const [auction, setAuction] = useState<AuctionWithItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bidAmount, setBidAmount] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number }>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  const loadAuction = useCallback(async () => {
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
  }, [params.id]);

  
  useEffect(() => {
    loadAuction();
  }, [loadAuction]);

  useEffect(() => {
    if (!auction) return;

    const calculateTimeLeft = () => {
      // Get current time in UTC milliseconds
      const nowUTC = Date.now();
      
      // Parse the end date string, removing microseconds
      const endDateString = auction.end_date.split('.')[0] + 'Z';
      const endUTC = new Date(endDateString).getTime();
      
      // Calculate time difference
      const timeLeft = endUTC - nowUTC;

      // Debug logging
      console.log('Auction times:', {
        now: new Date(nowUTC).toISOString(),
        end: new Date(endUTC).toISOString(),
        timeLeftMinutes: Math.floor(timeLeft / 1000 / 60),
        timeLeftSeconds: Math.floor(timeLeft / 1000),
        rawEndDate: auction.end_date,
        parsedEndDate: endDateString
      });

      // Handle expired auctions
      if (timeLeft < 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      const seconds = Math.floor((timeLeft / 1000) % 60);
      const minutes = Math.floor((timeLeft / (1000 * 60)) % 60);
      const hours = Math.floor((timeLeft / (1000 * 60 * 60)) % 24);
      const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));

      return { days, hours, minutes, seconds };
    };

    // Initial calculation
    setTimeLeft(calculateTimeLeft());

    // Update every second
    const interval = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);
      
      // If auction has ended, clear the interval
      if (Object.values(newTimeLeft).every(v => v === 0)) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [auction]);

  // Format the dates using UTC
  const formatDate = (dateString: string) => {
    // Remove microseconds before parsing
    const cleanDate = dateString.split('.')[0] + 'Z';
    const date = new Date(cleanDate);
    return date.toLocaleString(undefined, {
      timeZone: 'UTC',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const handleBidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auction || !user) return;

    setIsSubmitting(true);
    try {
      const amount = parseFloat(bidAmount);
      if (isNaN(amount)) {
        toast.error("Please enter a valid bid amount");
        return;
      }

      await createBid({
        amount,
        user_id: user.id,
        auction_id: auction.id,
      });

      toast.success("Bid placed successfully!");
      // Refresh auction data
      await loadAuction();
    } catch (err) {
      if (err instanceof AxiosError) {
        toast.error(err.response?.data?.detail || "Failed to place bid");
      } else {
        toast.error("Failed to place bid");
      }
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
                      {`${timeLeft.days}d ${timeLeft.hours}h ${timeLeft.minutes}m ${timeLeft.seconds}s`}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Start Date</p>
                    <p>{formatDate(auction.start_date)} UTC</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">End Date</p>
                    <p>{formatDate(auction.end_date)} UTC</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {(!user || user.role !== "seller" || user.id !== auction.user_id) && (
              <Card>
                <CardHeader>
                  <CardTitle>Place a Bid</CardTitle>
                  <CardDescription>Enter your bid amount</CardDescription>
                </CardHeader>
                <CardContent>
                  {user ? (
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
                  ) : (
                    <div className="space-y-4">
                      <p className="text-muted-foreground">Please log in to place a bid</p>
                      <Button 
                        className="w-full" 
                        size="lg"
                        onClick={() => router.push('/login')}
                      >
                        Login to Bid
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
} 