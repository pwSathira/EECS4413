import Link from "next/link";
import { Separator } from "@/components/ui/separator";

export function Footer() {
  return (
    <footer className="w-full border-t bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-3">
            <h3 className="font-semibold">About BidWize</h3>
            <ul className="space-y-2">
              <li><Link href="/about" className="text-sm text-muted-foreground hover:text-foreground">About Us</Link></li>
              <li><Link href="/careers" className="text-sm text-muted-foreground hover:text-foreground">Careers</Link></li>
              <li><Link href="/press" className="text-sm text-muted-foreground hover:text-foreground">Press</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-3">
            <h3 className="font-semibold">Support</h3>
            <ul className="space-y-2">
              <li><Link href="/help" className="text-sm text-muted-foreground hover:text-foreground">Help Center</Link></li>
              <li><Link href="/safety" className="text-sm text-muted-foreground hover:text-foreground">Safety Center</Link></li>
              <li><Link href="/contact" className="text-sm text-muted-foreground hover:text-foreground">Contact Us</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-3">
            <h3 className="font-semibold">Legal</h3>
            <ul className="space-y-2">
              <li><Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground">Terms of Service</Link></li>
              <li><Link href="/cookies" className="text-sm text-muted-foreground hover:text-foreground">Cookie Policy</Link></li>
            </ul>
          </div>

          {/* Social */}
          <div className="space-y-3">
            <h3 className="font-semibold">Follow Us</h3>
            <ul className="space-y-2">
              <li><Link href="https://twitter.com" className="text-sm text-muted-foreground hover:text-foreground">Twitter</Link></li>
              <li><Link href="https://facebook.com" className="text-sm text-muted-foreground hover:text-foreground">Facebook</Link></li>
              <li><Link href="https://instagram.com" className="text-sm text-muted-foreground hover:text-foreground">Instagram</Link></li>
            </ul>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Bottom section */}
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <p className="text-sm text-muted-foreground">
            © 2024 BidWize. All rights reserved.
          </p>
          <div className="flex space-x-4">
            <Link href="/accessibility" className="text-sm text-muted-foreground hover:text-foreground">
              Accessibility
            </Link>
            <Link href="/sitemap" className="text-sm text-muted-foreground hover:text-foreground">
              Sitemap
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}