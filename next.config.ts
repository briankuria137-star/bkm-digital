import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1", "localhost", "192.168.100.5"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "hwpmtfzqmsakvqzggwrx.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
