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

  // 🖼️ Configure allowed image domains for Next.js Image component
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'uavvljncupscxoxofcvp.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        pathname: '/**',
      },
    ],
  },

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

  // Add Cache-Control headers for flashcards routes to prevent stale data
  async headers() {
    return [
      {
        source: '/flashcards/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, max-age=0',
          },
        ],
      },
    ]
  },
};

export default nextConfig;
