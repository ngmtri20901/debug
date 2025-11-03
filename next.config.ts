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
  turbopack: {
    root: ".",
  },

  // ⚙️ Cải thiện tốc độ build cho Edge runtime
  reactStrictMode: false,

  // 📦 Increase Server Actions body size limit to 3MB for image uploads
  // Try both root level and experimental for compatibility
  serverActions: {
    bodySizeLimit: '3mb',
  },
  
  experimental: {
    serverActions: {
      bodySizeLimit: '3mb',
    },
  },
};

export default nextConfig;
