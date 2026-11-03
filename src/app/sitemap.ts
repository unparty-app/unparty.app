import type { MetadataRoute } from 'next';
import { getAllSiteRoutes } from '@/lib/site-routes';
import { SITE_URL } from '@/app/constants/organization';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes = await getAllSiteRoutes();

  return routes.map((r) => {
    const isContent = r.type === 'article' || r.type === 'story' || r.type === 'video';

    return {
      url: `${SITE_URL}${r.route}`,
      lastModified: r.lastModified,
      changeFrequency: isContent ? ('monthly' as const) : ('weekly' as const),
      priority: isContent ? 0.8 : r.route === '' ? 1 : 0.6,
      ...(r.videos && { videos: r.videos }),
    };
  });
}
