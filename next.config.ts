import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Allow images from Supabase Storage
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },

  // pdfkit requires native Node.js modules — mark as server-only externals
  serverExternalPackages: ['pdfkit'],

  // Turbopack config (Next.js 16+ default)
  turbopack: {},
};

export default nextConfig;
