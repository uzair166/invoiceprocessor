/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.externals = [...config.externals, { canvas: "canvas" }]; // Required for pdf-parse
    return config;
  },
};

module.exports = nextConfig;
