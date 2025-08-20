/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Allow Next.js to bundle ESM packages so they can be required from CJS modules
    // Fixes: require() of ES Module ...react-refractor... from sanity/lib/index.js not supported
    esmExternals: 'loose',
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "maps.googleapis.com",
        pathname: "/maps/api/**",
      },
    ],
  },
};

module.exports = nextConfig;
