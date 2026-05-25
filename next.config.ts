import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    // Proxy /api/uploads/* → backend server /uploads/*
    // This allows admin to load images even when APP_URL is localhost
    const backendBase = (
      process.env.ADMIN_API_URL || "http://localhost:3001/api"
    ).replace(/\/api$/, "");
    return [
      {
        source: "/api/uploads/:path*",
        destination: `${backendBase}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
