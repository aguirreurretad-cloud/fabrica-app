/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["playwright-core", "@sparticuz/chromium"],
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
