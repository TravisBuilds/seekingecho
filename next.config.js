/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  swcMinify: true,
  poweredByHeader: false,
  compress: true,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' *.googleapis.com *.gstatic.com maps.googleapis.com",
              "style-src 'self' 'unsafe-inline' *.googleapis.com fonts.googleapis.com",
              "img-src 'self' data: blob: *.googleapis.com *.gstatic.com maps.googleapis.com maps.gstatic.com",
              "font-src 'self' fonts.gstatic.com",
              "connect-src 'self' *.supabase.co *.googleapis.com *.google.com maps.googleapis.com",
              "frame-src 'self' *.google.com *.gstatic.com"
            ].join('; ')
          }
        ]
      }
    ];
  }
}

module.exports = nextConfig 