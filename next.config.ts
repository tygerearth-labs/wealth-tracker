import type { NextConfig } from "next";

// Collect all possible preview domain patterns
const previewDomains = [
  "space.z.ai",
  "space.chatglm.site",
];

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: previewDomains,
};

export default nextConfig;
