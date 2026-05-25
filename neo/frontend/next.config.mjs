/** @type {import('next').NextConfig} */
const nextConfig = {
  // 支持 iframe 嵌入模式
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "ALLOWALL",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
