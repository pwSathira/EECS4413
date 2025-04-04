/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://bidwize-core:8000/api/:path*',
      },
    ];
  },
  images: {
    domains: [
      'cdn.shopify.com',
      'admissions.rochester.edu',
      'placekitten.com',
      'www.google.com',
      'picsum.photos',
      'matterhornmusic.ca', 
      'images.unsplash.com',
      'unsplash.com',
    ],
  },
};

module.exports = nextConfig; 