import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // allow all domains for images
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
