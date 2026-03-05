import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ibslaw.kr';

    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: ['/admin/', '/api/', '/employee/', '/litigation/', '/counselor/'],
            },
        ],
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
