"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/contexts/UserContext";
import { Header } from "@/components/home-page/Header";
import { Footer } from "@/components/home-page/Footer";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { AuctionWithItem } from "@/types/auction";
import { fetchAuctionsWithItems } from "@/api/auction-api";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Clock, DollarSign, Gavel } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Order } from "../../types/order";

export default function AuctionsPage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const [auctions, setAuctions] = useState<AuctionWithItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedAuction, setSelectedAuction] = useState<AuctionWithItem | null>(null);
  const [paymentData, setPaymentData] = useState({
    card_number: "",
    card_holder_name: "",
    expiry_date: "",
    security_code: ""
  });
  const [completedOrders, setCompletedOrders] = useState<Order[]>([]);

  useEffect(() => {
    const loadAuctions = async () => {
      try {
        const data = await fetchAuctionsWithItems();
        setAuctions(data);
      } catch (err) {
        setError("Failed to load auctions");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const loadCompletedOrders = async () => {
      if (user) {
        try {
          const response = await fetch(`/api/v1/orders/user/${user.id}`);
          if (!response.ok) throw new Error('Failed to fetch orders');
          const data = await response.json();
          setCompletedOrders(data);
        } catch (err) {
          console.error('Error loading completed orders:', err);
        }
      }
    };

    loadAuctions();
    loadCompletedOrders();
  }, [user]);

  useEffect(() => {
    if (!userLoading && !user) {
      router.push("/login");
    }
  }, [user, userLoading, router]);

  if (userLoading || loading) {
    return (
      <div className="container mx-auto py-8">
        <Header />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading auctions...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Header />
        <div className="text-red-500">{error}</div>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // For sellers, show all their auctions
  const sellerAuctions = auctions.filter(auction => auction.user_id === user.id);
  // For buyers, show auctions they've bid on
  const buyerAuctions = auctions.filter(auction => 
    auction.bids?.some(bid => bid.user_id === user.id) ?? false
  );

  const handleEndAuction = async (auctionId: number) => {
    try {
      const response = await fetch(`/api/v1/auctions/${auctionId}/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.detail || 'Failed to end auction');
      }

      // Refresh auctions after ending
      const updatedAuctions = await fetchAuctionsWithItems();
      setAuctions(updatedAuctions);

      // Show success message
      toast.success(data.message || 'Auction ended successfully');
    } catch (err) {
      console.error('Error ending auction:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to end auction');
    }
  };

  const handleConfirmPurchase = async (auction: AuctionWithItem) => {
    setSelectedAuction(auction);
    setShowPaymentDialog(true);
  };

  const handlePaymentSubmit = async () => {
    if (!selectedAuction) return;

    try {
      const response = await fetch(`/api/v1/payments/process-auction-payment/${selectedAuction.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });
      
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(`Server returned non-JSON response: ${text}`);
      }
      
      if (!response.ok) {
        throw new Error(data.detail || data.error || 'Failed to process payment');
      }

      // Refresh auctions and orders after successful payment
      const updatedAuctions = await fetchAuctionsWithItems();
      setAuctions(updatedAuctions);
      
      const ordersResponse = await fetch(`/api/v1/orders/user/${user?.id}`);
      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json();
        setCompletedOrders(ordersData);
      }

      setShowPaymentDialog(false);
      setSelectedAuction(null);
      setPaymentData({
        card_number: "",
        card_holder_name: "",
        expiry_date: "",
        security_code: ""
      });

      toast.success(data.message || 'Payment processed successfully');
    } catch (err) {
      console.error('Error processing payment:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to process payment');
    }
  };

  const renderAuctionCard = (auction: AuctionWithItem) => {
    const endDateString = auction.end_date.split('.')[0] + 'Z';
    const isActive = auction.is_active;

    // Calculate user's maximum bid for this auction
    const userMaxBid = user ? auction.bids
      .filter(bid => bid.user_id === user.id)
      .reduce((max, bid) => Math.max(max, bid.amount), 0) : 0;

    // Check if the current user is the winner
    const isWinner = !isActive && auction.winning_bid_id && 
      auction.bids.find(bid => bid.id === auction.winning_bid_id)?.user_id === user.id;

    return (
      <Card key={auction.id} className="flex flex-col">
        <CardHeader>
          <div className="aspect-square relative mb-2">
            <Image
              width={500}
              height={500}
              src={auction.item.image_url}
              alt={auction.item.name}
              className="object-cover rounded-lg w-full h-full"
            />
          </div>
          <CardTitle>{auction.item.name}</CardTitle>
          <CardDescription>{auction.item.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Current Bid</p>
              <p className="font-semibold">${auction.current_price.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className={`font-semibold ${isActive ? 'text-green-600' : 'text-red-600'}`}>
                {isActive ? 'Active' : 'Ended'}
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="w-4 h-4 mr-2" />
              <span>Ends: {format(new Date(endDateString), 'MMM d, yyyy h:mm a')}</span>
            </div>
            <div className="flex items-center text-sm text-muted-foreground">
              <DollarSign className="w-4 h-4 mr-2" />
              <span>Min Increment: ${auction.min_bid_increment.toFixed(2)}</span>
            </div>
            {userMaxBid > 0 && (
              <div className="flex items-center text-sm text-blue-600">
                <DollarSign className="w-4 h-4 mr-2" />
                <span>Your Max Bid: ${userMaxBid.toFixed(2)}</span>
              </div>
            )}
            {!isActive && auction.winning_bid_id && (
              <div className="flex items-center text-sm text-green-600">
                <Gavel className="w-4 h-4 mr-2" />
                <span>Auction Ended - Winner Determined</span>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="mt-auto space-x-2">
          <Button 
            className="flex-1"
            onClick={() => router.push(`/auction/${auction.id}`)}
          >
            View Details
          </Button>
          {user.role === "seller" && isActive && (
            <Button 
              variant="destructive"
              onClick={() => handleEndAuction(auction.id)}
            >
              End Auction
            </Button>
          )}
          {isWinner && (
            <Button 
              variant="default"
              onClick={() => handleConfirmPurchase(auction)}
            >
              Confirm Purchase
            </Button>
          )}
        </CardFooter>
      </Card>
    );
  };

  const renderCompletedOrders = () => {
    if (!completedOrders.length) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          No completed orders yet
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {completedOrders.map((order) => (
          <Card key={order.id} className="flex flex-col">
            <CardHeader>
              <CardTitle>Order #{order.id}</CardTitle>
              <CardDescription>
                {order.item?.name || 'Loading item details...'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">Total Paid</p>
                  <p className="font-semibold">${order.total_paid.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-semibold text-green-600">Completed</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center text-sm text-muted-foreground">
                  <span>Shipping Address:</span>
                </div>
                <div className="text-sm">
                  <p>{order.street_address}</p>
                  <p>{order.province}, {order.country}</p>
                  <p>{order.postal_code}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto py-8">
      <Header />
      <header className="mt-8 mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold mb-2">My Auctions</h1>
            <p className="text-muted-foreground">
              {user.role === "seller" 
                ? "Manage your auctions and track their status" 
                : "View auctions you've bid on"}
            </p>
          </div>
          {user.role === "seller" && (
            <Button onClick={() => router.push('/create-auction')}>
              <Plus className="w-4 h-4 mr-2" />
              Create Auction
            </Button>
          )}
        </div>
        <Separator className="my-4" />
      </header>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="ended">Ended</TabsTrigger>
          <TabsTrigger value="completed">Completed Orders</TabsTrigger>
        </TabsList>
        <TabsContent value="active">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(user.role === "seller" ? sellerAuctions : buyerAuctions)
              .filter(auction => auction.is_active)
              .map(renderAuctionCard)}
          </div>
        </TabsContent>
        <TabsContent value="ended">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(user.role === "seller" ? sellerAuctions : buyerAuctions)
              .filter(auction => !auction.is_active)
              .filter(auction => !completedOrders.some(order => order.auction_id === auction.id))
              .map(renderAuctionCard)}
          </div>
        </TabsContent>
        <TabsContent value="completed">
          {renderCompletedOrders()}
        </TabsContent>
      </Tabs>

      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Purchase</DialogTitle>
            <DialogDescription>
              Please enter your payment information to complete the purchase.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="card_number">Card Number</Label>
              <Input
                id="card_number"
                value={paymentData.card_number}
                onChange={(e) => setPaymentData({ ...paymentData, card_number: e.target.value })}
                placeholder="1234 5678 9012 3456"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="card_holder_name">Card Holder Name</Label>
              <Input
                id="card_holder_name"
                value={paymentData.card_holder_name}
                onChange={(e) => setPaymentData({ ...paymentData, card_holder_name: e.target.value })}
                placeholder="John Doe"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="expiry_date">Expiry Date</Label>
                <Input
                  id="expiry_date"
                  value={paymentData.expiry_date}
                  onChange={(e) => setPaymentData({ ...paymentData, expiry_date: e.target.value })}
                  placeholder="MM/YY"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="security_code">Security Code</Label>
                <Input
                  id="security_code"
                  value={paymentData.security_code}
                  onChange={(e) => setPaymentData({ ...paymentData, security_code: e.target.value })}
                  placeholder="123"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handlePaymentSubmit}>
              Complete Purchase
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
} 