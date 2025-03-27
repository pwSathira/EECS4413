"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Header } from "../components/home-page/Header";
import { Footer } from "../components/home-page/Footer";
import { useEffect, useState } from "react";
import { AuctionWithItem } from "../types/auction";
import { fetchAuctionsWithItems } from "../api/auction-api";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function Home() {
  const [auctions, setAuctions] = useState<AuctionWithItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  if (loading) {
    return <div className="container mx-auto py-8">Loading auctions...</div>;
  }

  if (error) {
    return <div className="container mx-auto py-8 text-red-500">{error}</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <Header />
      <header className="mt-8 mb-8">
        <h1 className="text-4xl font-bold mb-2">Active Auctions</h1>
        <p className="text-muted-foreground">Discover unique items and place your bids</p>
        <Separator className="my-4" />
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {auctions.map((auction) => {
          const timeLeft = new Date(auction.end_date).getTime() - new Date().getTime();
          const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
          const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

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
                    <p className="font-semibold">${auction.item.initial_price}</p>
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
      <Footer />
    </div>
  );
}