import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://minikitchen.lk';

  return [
    {
      url: `${baseUrl}/`,
      lastModified: new Date('2026-10-24T00:00:00Z'),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
  ];
}

