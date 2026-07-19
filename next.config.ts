import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Silences Turbopack's workspace-root inference warning — a stray package-lock.json in
  // the parent Downloads folder was otherwise getting picked as the root.
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
