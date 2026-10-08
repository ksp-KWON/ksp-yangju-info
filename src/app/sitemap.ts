import fs from 'fs';
import path from 'path';
import { MetadataRoute } from 'next';
import { getSortedPostsData } from '@/lib/posts';
import { EMERGENCY_PLACES } from '@/lib/data/emergency-places';
import { SITE_URL } from '@/lib/constants';

export const dynamic = 'force-static';

// 사이트 론칭 기준일 (정적 페이지용 안정적인 lastModified)
const SITE_LAUNCH_DATE = '2026-01-01';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = SITE_URL;

  // 1. 핵심 서비스 및 공공 안내 정적 라우트
  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: SITE_LAUNCH_DATE,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: SITE_LAUNCH_DATE,
    },
    {
      url: `${baseUrl}/services/emergency`,
      lastModified: SITE_LAUNCH_DATE,
    },
    {
      url: `${baseUrl}/services/learning`,
      lastModified: SITE_LAUNCH_DATE,
    },
    // Google E-E-A-T 신뢰도 & 투명성 필수 페이지
    {
      url: `${baseUrl}/about`,
      lastModified: SITE_LAUNCH_DATE,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: SITE_LAUNCH_DATE,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: SITE_LAUNCH_DATE,
    },
  ];

  // 2. 의정부 응급의료기관 및 심야약국 상세 페이지
  const emergencyPlaceRoutes: MetadataRoute.Sitemap = EMERGENCY_PLACES.map((place) => ({
    url: `${baseUrl}/services/emergency/${place.slug}`,
    lastModified: SITE_LAUNCH_DATE,
  }));

  // 3. 블로그 상세 페이지들 (실제 포스트 발행일 및 수정일 반영)
  const posts = getSortedPostsData();
  const postRoutes: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: post.updatedAt || post.date || SITE_LAUNCH_DATE,
  }));

  // 4. 의정부 평생학습 실시간 강좌 상세 페이지 (전수 색인)
  let learningRoutes: MetadataRoute.Sitemap = [];
  try {
    const lPath = path.join(process.cwd(), 'src/data/learning-courses.json');
    if (fs.existsSync(lPath)) {
      const lData = JSON.parse(fs.readFileSync(lPath, 'utf8'));
      learningRoutes = (lData.courses || []).map((c: { id: string }) => ({
        url: `${baseUrl}/services/learning/${c.id}`,
        lastModified: SITE_LAUNCH_DATE,
      }));
    }
  } catch (e) {
    console.error('Failed to add learning routes to sitemap:', e);
  }

  return [...routes, ...emergencyPlaceRoutes, ...postRoutes, ...learningRoutes];
}
