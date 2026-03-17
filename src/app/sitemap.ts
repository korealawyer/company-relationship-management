import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: 'https://ibslaw.kr', lastModified: new Date() },
    { url: 'https://ibslaw.kr/sales', lastModified: new Date() },
    { url: 'https://ibslaw.kr/pricing', lastModified: new Date() },
    { url: 'https://ibslaw.kr/consultation', lastModified: new Date() },
  ];
}
