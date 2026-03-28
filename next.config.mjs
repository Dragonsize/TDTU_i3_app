/** @type {import('next').NextConfig} */
const nextConfig = {
  // /api/* is proxied via src/app/api/[...path]/route.js
  // This ensures Set-Cookie headers from FastAPI are forwarded correctly.

  // Tree-shake lucide-react: transforms barrel imports like
  // `import { X, Check } from 'lucide-react'` into direct file imports,
  // dramatically reducing the number of modules loaded on startup.
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{kebabCase member}}',
    },
  },

  // Experimental optimizations for faster page loads
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  headers: async () => {
    const privateRoutes = [
      '/auth/:path*',
      '/login',
      '/signup',
      '/reset-password',
      '/dashboard/:path*',
      '/project/:path*',
      '/calendar/:path*',
      '/chat/:path*',
      '/chatbot/:path*',
      '/files/:path*',
      '/settings/:path*',
    ];

    return privateRoutes.map((source) => ({
      source,
      headers: [
        {
          key: 'X-Robots-Tag',
          value: 'noindex, nofollow, noarchive',
        },
      ],
    }));
  },
};
export default nextConfig;