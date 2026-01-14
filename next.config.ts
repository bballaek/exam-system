import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Compress responses
  compress: true,
  
  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  
  // Production optimizations
  ...(process.env.NODE_ENV === 'production' && {
    // Enable SWC minification
    swcMinify: true,
    
    // Optimize fonts
    optimizeFonts: true,
  }),

  // Experimental features for better performance
  experimental: {
    // Optimize package imports
    optimizePackageImports: ['lucide-react', 'recharts'],
  },
};

export default nextConfig;
