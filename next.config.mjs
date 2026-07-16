/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Placeholder images are generated locally / inline SVG, so no remote patterns needed yet.
  experimental: {
    // Ensures Prisma client resolves correctly in server components / actions.
    serverComponentsExternalPackages: ["@prisma/client", "bcryptjs"],
  },
};

export default nextConfig;
