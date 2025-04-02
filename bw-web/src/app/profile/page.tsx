'use client'

import { useEffect, useState } from "react";
import { useUser } from "@/contexts/UserContext";
import { redirect } from "next/navigation";
import axios from "axios";

interface Auction {
  id: number;
  title?: string;
  name?: string;
  type: "forward" | "dutch";
  current_price: number;
  status: string;
}

export default function ProfilePage() {
  const { user } = useUser();
  const [auctions, setAuctions] = useState<Auction[] | null>(null); // ⬅️ null until loaded

  useEffect(() => {
    if (user?.role === "seller") {
      axios
        .get(`http://localhost:8000/api/v1/auctions?seller_id=${user.id}`)
        .then((res) => {
          console.log("Raw auctions API response:", res.data);
          setAuctions(res.data);
        })
        .catch((err) => {
          console.error("Failed to load auctions:", err);
          setAuctions([]);
        });
    }
  }, [user]);
  

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6">My Profile</h1>
      <div className="space-y-4 text-lg mb-10">
        <p><strong>Username:</strong> {user.username}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Role:</strong> {user.role}</p>
      </div>

      {user.role === "seller" && (
        <div>
          <h2 className="text-2xl font-semibold mb-4">My Auctions</h2>

          {auctions === null ? (
            <p className="text-gray-500">Loading...</p>
          ) : auctions.length === 0 ? (
            <p className="text-gray-500">You have no auctions listed yet.</p>
          ) : (
            <ul className="space-y-4">
              {auctions.map((auction) => (
                <li key={auction.id} className="border p-4 rounded shadow-sm">
                  <p><strong>Title:</strong> {auction.title || auction.name}</p>
                  <p><strong>Type:</strong> {auction.type}</p>
                  <p><strong>Current Price:</strong> ${auction.current_price}</p>
                  <p><strong>Status:</strong> {auction.status}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
