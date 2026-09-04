import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const monorepoRoot = path.resolve(__dirname, "../../");

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: monorepoRoot,
  },
  reactStrictMode: true,
};

export default nextConfig;
