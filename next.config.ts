/** @type {import('next').NextConfig} */
const nextConfig = {
  // 🚀 Bỏ qua ESLint check khi build
  eslint: {
    ignoreDuringBuilds: true,
  },

  // 🧩 Bỏ qua TypeScript type-check (chỉ build, không validate .ts)
  typescript: {
    ignoreBuildErrors: true,
  },

  // 🧱 Không tạo source maps để giảm thời gian build
  productionBrowserSourceMaps: false,

  // 💨 Bật experimental turbopack (nếu bạn đang ở Next 15)
  turbopack: {},

  // ⚙️ Cải thiện tốc độ build cho Edge runtime
  reactStrictMode: false,
};

export default nextConfig;
