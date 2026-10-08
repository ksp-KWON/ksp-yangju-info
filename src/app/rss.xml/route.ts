import { NextResponse } from 'next/server';
import { getSortedPostsData } from '@/lib/posts';
import { SITE_URL, SITE_NAME } from '@/lib/constants';

export const dynamic = 'force-static';

export async function GET() {
  const siteUrl = SITE_URL;
  const posts = getSortedPostsData();

  let rssXml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>${SITE_NAME}</title>
  <link>${siteUrl}</link>
  <description>의정부 시민들을 위한 응급실·건강검진·민원 등 생활 정보 가이드</description>
  <language>ko-KR</language>
  <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml" />
  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
`;

  posts.slice(0, 50).forEach((post) => {
    const postUrl = `${siteUrl}/blog/${post.slug}`;
    const pubDate = new Date(post.date).toUTCString();
    const categories = Array.isArray(post.category) ? post.category : post.category ? [post.category] : [];

    rssXml += `
  <item>
    <title><![CDATA[${post.title}]]></title>
    <link>${postUrl}</link>
    <guid isPermaLink="true">${postUrl}</guid>
    <description><![CDATA[${post.summary || post.title}]]></description>
    <pubDate>${pubDate}</pubDate>
    ${categories.map((c) => `<category><![CDATA[${c}]]></category>`).join('\n    ')}
  </item>`;
  });

  rssXml += `
</channel>
</rss>`;

  return new NextResponse(rssXml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400',
    },
  });
}
