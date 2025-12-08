/** @type {import('next').NextConfig} */

// Bundle analyzer - run with ANALYZE=true npm run build
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  // Use webpack for build (Turbopack compatibility)
  turbopack: {},
  // Exclude anthropic-quickstarts from build
  pageExtensions: ['ts', 'tsx', 'js', 'jsx'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.in',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // BUNDLE OPTIMIZATION
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Enable SWC minification (faster than Terser)
  swcMinify: true,
  
  // Compiler options for optimization
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  
  // Experimental optimizations
  experimental: {
    // Optimize package imports for tree-shaking
    optimizePackageImports: [
      'lucide-react',
      'date-fns',
      '@radix-ui/react-icons',
      'recharts',
      '@tanstack/react-table',
    ],
  },
  
  // Webpack configuration for bundle optimization
  webpack: (config, { isServer, dev }) => {
    // Only run in production client builds
    if (!isServer && !dev) {
      // ═══════════════════════════════════════════════════════════════════════
      // TREE-SHAKING OPTIMIZATION
      // ═══════════════════════════════════════════════════════════════════════
      
      // Ensure proper tree-shaking
      config.optimization = {
        ...config.optimization,
        usedExports: true,
        sideEffects: true,
        minimize: true,
        splitChunks: {
          chunks: 'all',
          minSize: 20000,
          maxSize: 244000, // ~238KB chunks for better caching
          cacheGroups: {
            // Separate vendor chunks for better caching
            framework: {
              name: 'framework',
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
              priority: 40,
              enforce: true,
            },
            // UI component libraries
            ui: {
              name: 'ui-libs',
              test: /[\\/]node_modules[\\/](@radix-ui|@headlessui|class-variance-authority|clsx|tailwind-merge)[\\/]/,
              priority: 30,
              enforce: true,
            },
            // Date utilities
            dates: {
              name: 'date-utils',
              test: /[\\/]node_modules[\\/](date-fns)[\\/]/,
              priority: 25,
              enforce: true,
            },
            // Icons
            icons: {
              name: 'icons',
              test: /[\\/]node_modules[\\/](lucide-react|@radix-ui[\\/]react-icons)[\\/]/,
              priority: 20,
              enforce: true,
            },
            // Supabase client
            supabase: {
              name: 'supabase',
              test: /[\\/]node_modules[\\/](@supabase)[\\/]/,
              priority: 15,
              enforce: true,
            },
            // Charts (heavy library)
            charts: {
              name: 'charts',
              test: /[\\/]node_modules[\\/](recharts|d3-|victory)[\\/]/,
              priority: 15,
              enforce: true,
            },
            // Other vendors
            vendor: {
              name: 'vendor',
              test: /[\\/]node_modules[\\/]/,
              priority: 10,
              reuseExistingChunk: true,
            },
          },
        },
      };

      // ═══════════════════════════════════════════════════════════════════════
      // MODULE RESOLUTION ALIASES FOR OPTIMIZED IMPORTS
      // ═══════════════════════════════════════════════════════════════════════
      
      config.resolve.alias = {
        ...config.resolve.alias,
        // Force ES modules for better tree-shaking
        'lodash': 'lodash-es',
      };
    }

    return config;
  },
  
  // Modular imports configuration
  modularizeImports: {
    // Optimize lucide-react imports
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{kebabCase member}}',
      preventFullImport: true,
    },
    // Optimize date-fns imports (if using barrel imports)
    'date-fns': {
      transform: 'date-fns/{{member}}',
      preventFullImport: true,
    },
  },
};

module.exports = withBundleAnalyzer(nextConfig);

