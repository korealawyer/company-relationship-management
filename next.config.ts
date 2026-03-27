import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['adm-zip'],
  transpilePackages: ['@blocknote/core', '@blocknote/react', '@blocknote/mantine'],
  turbopack: {
    resolveAlias: {
      'adm-zip': { browser: './src/lib/ocr/adm-zip-stub.js' },
    },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" }, // DENY 대신 SAMEORIGIN 사용시 자신의 사이트 내 iframe 호환성 확보
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        ],
      },
    ];
  },
};

export default nextConfig;
