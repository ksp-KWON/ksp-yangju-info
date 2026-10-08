import { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/constants';

export const dynamic = 'force-static';

/**
 * robots.ts - Next.js App Router W3C & Google Search Console 표준
 *
 * 크롤 예산 보호 및 무의미한 엔드포인트 색인 방지:
 *   /search - 검색 결과 쿼리 페이지
 *   /api/   - 내부 API 엔드포인트
 *   /*opengraph-image* - 동적 OG 이미지 생성 엔드포인트 원시 호출 차단
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = SITE_URL;

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/search', '/api/', '/*opengraph-image*'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
