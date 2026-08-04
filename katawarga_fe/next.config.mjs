/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow NextAuth to work across different host addresses (localhost and LAN IP)
  // This prevents CLIENT_FETCH_ERROR when accessing from network IP (e.g. 192.168.x.x)
  async headers() {
    return [
      {
        source: "/api/auth/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type" },
        ],
      },
    ];
  },
};

export default nextConfig;
