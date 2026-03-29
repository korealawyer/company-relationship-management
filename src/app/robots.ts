import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { 
      userAgent: '*', 
      allow: '/', 
      disallow: ['/admin/', '/employee/', '/lawyer/', '/counselor/', '/litigation/', '/dashboard/', '/personal-litigation/'] 
    },
    sitemap: 'https://ibslaw.co.kr/sitemap.xml',
  };
}
