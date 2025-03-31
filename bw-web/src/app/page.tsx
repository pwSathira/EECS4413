"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Header } from "../components/home-page/Header";
import { Footer } from "../components/home-page/Footer";
import { useEffect, useState, useMemo } from "react";
import { AuctionWithItem } from "../types/auction";
import { fetchAuctionsWithItems } from "../api/auction-api";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function Home() {
  const [auctions, setAuctions] = useState<AuctionWithItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

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

    loadAuctions();
  }, []);

  // Filter auctions based on search query
  const filteredAuctions = useMemo(() => {
    // First filter for active auctions only
    const activeAuctions = auctions.filter(auction => auction.is_active);
    
    if (!searchQuery.trim()) return activeAuctions;

    const query = searchQuery.toLowerCase().trim();
    return activeAuctions.filter((auction) => {
      const nameMatch = auction.item.name.toLowerCase().includes(query);
      const descriptionMatch = auction.item.description.toLowerCase().includes(query);
      return nameMatch || descriptionMatch;
    });
  }, [auctions, searchQuery]);

  if (loading) {
    return <div className="container mx-auto py-8">Loading auctions...</div>;
  }

  if (error) {
    return <div className="container mx-auto py-8 text-red-500">{error}</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      <header className="mt-8 mb-8">
        <h1 className="text-4xl font-bold mb-2">Active Auctions</h1>
        <p className="text-muted-foreground">Discover unique items and place your bids</p>
        <Separator className="my-4" />
      </header>

      {filteredAuctions.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No auctions found matching your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAuctions.map((auction) => {
            // Parse the end date string, removing microseconds
            const endDateString = auction.end_date.split('.')[0] + 'Z';
            const endUTC = new Date(endDateString).getTime();
            const nowUTC = Date.now();
            
            // Calculate time difference
            const timeLeft = endUTC - nowUTC;
            
            // Calculate hours and minutes
            const hoursLeft = Math.max(0, Math.floor(timeLeft / (1000 * 60 * 60)));
            const minutesLeft = Math.max(0, Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60)));

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
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-muted-foreground">Current Bid</p>
                      <p className="font-semibold">${auction.current_price.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Time Left</p>
                      <p className="font-semibold">{`${hoursLeft}h ${minutesLeft}m`}</p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="mt-auto">
                  <Button 
                    className="w-full"
                    onClick={() => router.push(`/auction/${auction.id}`)}
                  >
                    Place Bid
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
      <Footer />
    </div>
  );
}