"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/contexts/UserContext";
import { Header } from "@/components/home-page/Header";
import { Footer } from "@/components/home-page/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
//import DOMPurify from 'dompurify';
import { cn } from "@/lib/utils";

export default function CreateAuctionPage() {
  const router = useRouter();
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [itemName, setItemName] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [initialPrice, setInitialPrice] = useState("");
  const [minBidIncrement, setMinBidIncrement] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>();
  

  const handleSubmit = async (e: React.FormEvent) => {

    e.preventDefault();
    if (!user) return;
    const isValidImageUrl = (url: string) =>
      /\.(jpeg|jpg|png|gif|webp|svg)$/.test(url.split('?')[0]);
  
    if (!isValidImageUrl(imageUrl)) {
      toast.error("Image URL must end in .jpg, .png, .gif, etc.");
      return;
    }

    setLoading(true);
    try {
      // First create the item
      const itemResponse = await fetch("/api/items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: itemName,
          description: itemDescription,
          initial_price: parseFloat(initialPrice),
          image_url: imageUrl,
          user_id: user.id,
        }),
      });

      if (!itemResponse.ok) {
        throw new Error("Failed to create item");
      }

      const item = await itemResponse.json();

      // Then create the auction
      const auctionResponse = await fetch("/api/auctions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          start_date: startDate?.toISOString(),
          end_date: endDate?.toISOString(),
          min_bid_increment: parseFloat(minBidIncrement),
          item_id: item.id,
          user_id: user.id,
        }),
      });

      if (!auctionResponse.ok) {
        throw new Error("Failed to create auction");
      }

      toast.success("Auction created successfully!");
      router.push("/auctions");
    } catch (error) {
      console.error(error);
      toast.error("Failed to create auction");
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== "seller") {
    router.push("/auctions");
    return null;
  }

  return (
    <div className="container mx-auto py-8">
      <Header />
      <div className="max-w-2xl mx-auto">
        <header className="mt-8 mb-8">
          <h1 className="text-4xl font-bold mb-2">Create New Auction</h1>
          <p className="text-muted-foreground">Fill in the details to create a new auction</p>
          <Separator className="my-4" />
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Auction Details</CardTitle>
            <CardDescription>Enter the details for your new auction</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="itemName">Item Name</Label>
                  <Input
                    id="itemName"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="itemDescription">Item Description</Label>
                  <Textarea
                    id="itemDescription"
                    value={itemDescription}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setItemDescription(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="initialPrice">Initial Price ($)</Label>
                  <Input
                    id="initialPrice"
                    type="number"
                    min="0"
                    step="1"
                    value={initialPrice}
                    onChange={(e) => setInitialPrice(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="minBidIncrement">Minimum Bid Increment ($)</Label>
                  <Input
                    id="minBidIncrement"
                    type="number"
                    min="0"
                    step="1"
                    value={minBidIncrement}
                    onChange={(e) => setMinBidIncrement(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="imageUrl">Image URL</Label>
                  <Input
                    id="imageUrl"
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Start Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !startDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={setStartDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <Label>End Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !endDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={setEndDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/auctions")}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Creating..." : "Create Auction"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
} 