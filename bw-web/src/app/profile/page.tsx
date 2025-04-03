'use client'

import { useEffect, useState } from "react";
import { useUser } from "@/contexts/UserContext";
import { redirect } from "next/navigation";
import axios from "axios";
import { Header } from "@/components/home-page/Header";
import { Footer } from "@/components/home-page/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Package, History, Settings } from "lucide-react";
import { Order } from "@/types/order";
import { fetchUserOrders } from "@/api/order-api";

interface Auction {
  id: number;
  is_active: boolean;
  created_at: string; // ISO date string
  winning_bid_id?: number | null;
  user_id: number;
  item_id: number;
  start_date: string; // ISO date string
  end_date: string;   // ISO date string
  min_bid_increment?: number;
}

export default function ProfilePage() {
  const { user } = useUser();
  const [auctions, setAuctions] = useState<Auction[] | null>(null);
  const [completedOrders, setCompletedOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    if (user?.role === "seller") {
      axios
        .get(`http://localhost:8000/api/v1/auctions/startedby2?seller_id=${user.id}`)
        .then((res) => {
          console.log("Raw auctions API response:", res.data);
          setAuctions(res.data);
        })
        .catch((err) => {
          console.error("Failed to load auctions:", err);
          setAuctions([]);
        });
    }

    // Load completed orders
    const loadCompletedOrders = async () => {
      if (user) {
        try {
          const data = await fetchUserOrders(user.id);
          setCompletedOrders(data);
        } catch (err) {
          console.error('Error loading completed orders:', err);
        } finally {
          setLoadingOrders(false);
        }
      }
    };

    loadCompletedOrders();
  }, [user]);
  

  if (!user) {
    redirect("/login");
  }

  const renderCompletedOrders = () => {
    if (loadingOrders) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      );
    }

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
                {order.item?.name || 'Item details not available'}
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
      
      {/* Profile Header */}
      <div className="relative bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-8 mb-8">
        <div className="flex items-center space-x-6">
          <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center">
            <User className="w-12 h-12 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{user.username}</h1>
            <p className="text-muted-foreground">{user.email}</p>
            <div className="mt-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary">
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Overview
            </TabsTrigger>
            {user.role === "seller" && (
              <TabsTrigger value="auctions" className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                My Auctions
              </TabsTrigger>
            )}
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              History
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Overview</CardTitle>
                <CardDescription>Your account information and statistics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Username</p>
                    <p className="font-medium">{user.username}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{user.email}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Role</p>
                    <p className="font-medium capitalize">{user.role}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Member Since</p>
                    <p className="font-medium">2024</p>
                  </div>
                </div>
                <Separator />
                <div className="flex justify-end">
                  <Button variant="outline">Edit Profile</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {user.role === "seller" && (
            <TabsContent value="auctions" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>My Auctions</CardTitle>
                  <CardDescription>Manage your active and completed auctions</CardDescription>
                </CardHeader>
                <CardContent>
                  {auctions === null ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : auctions.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">You have no auctions listed yet.</p>
                      <Button className="mt-4">Create New Auction</Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {auctions.map((auction) => (
                        <Card key={auction.id}>
                          <CardContent className="pt-6">
                            <div className="flex justify-between items-start">
                              <div className="space-y-2">
                                <h3 className="font-semibold">Auction #{auction.id}</h3>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <span>Start Date: {new Date(auction.start_date).toLocaleDateString()}</span>
                                  <span>End Date: {new Date(auction.end_date).toLocaleDateString()}</span>
                                </div>
                                {/* <p className="text-sm text-muted-foreground">
                                  Created At: {new Date(auction.created_at).toLocaleDateString()}
                                </p> */} 
                                <p className="text-sm text-muted-foreground">
                                  Winning Bid ID: {auction.winning_bid_id || "No winning bid yet"}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Min Bid Increment: ${auction.min_bid_increment?.toFixed(2) || "N/A"}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className={`text-sm font-semibold ${auction.is_active ? "text-green-600" : "text-red-600"}`}>
                                  {auction.is_active ? "Active" : "Inactive"}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            )}

          <TabsContent value="history" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>View your past transactions and orders</CardDescription>
              </CardHeader>
              <CardContent>
                {renderCompletedOrders()}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>Manage your account preferences and security</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  Settings page coming soon.
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
}
