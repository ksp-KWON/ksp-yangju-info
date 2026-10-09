import { MetadataRoute } from 'next';
import { getSortedPostsData } from '@/lib/posts';
import { getLearningData } from '@/lib/learning';
import { EMERGENCY_PLACES } from '@/lib/data/emergency-places';
import { SITE_URL } from '@/lib/constants';

export const dynamic = 'force-static';

// 사이트 론칭 기준일 (정적 페이지용 안정적인 lastModified)
const SITE_LAUNCH_DATE = '2026-01-01';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = SITE_URL;

  // 1. 핵심 서비스 및 공공 안내 정적 라우트 (W3C & Google Search Central 표준)
  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: SITE_LAUNCH_DATE,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: SITE_LAUNCH_DATE,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/services/emergency`,
      lastModified: SITE_LAUNCH_DATE,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/services/learning`,
      lastModified: SITE_LAUNCH_DATE,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    // Google E-E-A-T 신뢰도 & 투명성 필수 페이지
    {
      url: `${baseUrl}/about`,
      lastModified: SITE_LAUNCH_DATE,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: SITE_LAUNCH_DATE,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: SITE_LAUNCH_DATE,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];

  // 2. 양주 응급의료기관 및 심야약국 상세 페이지
  const emergencyPlaceRoutes: MetadataRoute.Sitemap = EMERGENCY_PLACES.map((place) => ({
    url: `${baseUrl}/services/emergency/${place.slug}`,
    lastModified: SITE_LAUNCH_DATE,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  // 3. 블로그 상세 페이지들 (실제 포스트 발행일 및 수정일 반영)
  const posts = getSortedPostsData();
  const postRoutes: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: post.updatedAt || post.date || SITE_LAUNCH_DATE,
    changeFrequency: 'monthly',
    priority: 0.8,
  }));

  // 4. 양주 평생학습 실시간 강좌 상세 페이지 (전수 색인)
  const { courses } = getLearningData();
  const learningRoutes: MetadataRoute.Sitemap = courses.map((c) => ({
    url: `${baseUrl}/services/learning/${c.id}`,
    lastModified: SITE_LAUNCH_DATE,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  return [...routes, ...emergencyPlaceRoutes, ...postRoutes, ...learningRoutes];
}
