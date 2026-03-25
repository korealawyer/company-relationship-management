import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['adm-zip'],
  transpilePackages: ['@blocknote/core', '@blocknote/react', '@blocknote/mantine'],
  turbopack: {
    resolveAlias: {
      'adm-zip': { browser: './src/lib/ocr/adm-zip-stub.js' },
    },
  },
};

export default nextConfig;
