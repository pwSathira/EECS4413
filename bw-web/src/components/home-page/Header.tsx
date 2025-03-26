"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function Header() {
  const router = useRouter();

  return (
    <header className="w-full border-b">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo and Company Name */}
        <div className="flex items-center space-x-4">
          <Link href="/" className="flex items-center space-x-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6"
            >
              <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
            </svg>
            <span className="font-bold text-xl">BidWize</span>
          </Link>
        </div>

        {/* Search Bar */}
        <div className="hidden md:flex items-center w-full max-w-sm mx-4">
          <div className="relative w-full">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search auctions..."
              className="pl-8"
            />
          </div>
        </div>

        {/* Auth Buttons */}
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => router.push('/login')}
          >
            Log in
          </Button>
          <Button 
            size="sm"
            onClick={() => router.push('/sign-up')}
          >
            Sign up
          </Button>
        </div>
      </div>
    </header>
  );
}