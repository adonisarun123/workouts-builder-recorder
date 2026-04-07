import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Monorepo: trace dependencies from repo root (parent of `web/`) for correct serverless bundles.
  outputFileTracingRoot: path.join(__dirname, ".."),
};

export default nextConfig;
