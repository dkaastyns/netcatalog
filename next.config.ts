import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable gzip compression for all responses
  compress: true,
  // Remove X-Powered-By header (security + slight perf improvement)
  poweredByHeader: false,
  images: {
    // Allow Cloudinary and Supabase images to be optimized by Next.js
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
    // Serve images in modern formats (WebP/AVIF) when supported
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
