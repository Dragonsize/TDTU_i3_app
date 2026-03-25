/** @type {import('next').NextConfig} */
const nextConfig = {
  rewrites: async () => {
    return [
      {
        source: '/api/:path*',
        destination: 'http://127.0.0.1:8000/api/:path*',
      },
    ]
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