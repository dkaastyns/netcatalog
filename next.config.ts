import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevent static pre-rendering for pages that query the database
  // Each page with DB access exports `dynamic = 'force-dynamic'` individually
  experimental: {
    // Ensure DB-querying pages are always dynamic
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
