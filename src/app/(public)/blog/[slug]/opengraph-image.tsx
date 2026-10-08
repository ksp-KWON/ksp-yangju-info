import { ImageResponse } from 'next/og';
import { getSortedPostsData, getPostData } from '@/lib/posts';

export function generateStaticParams() {
  const posts = getSortedPostsData();
  return posts.map((post) => ({ slug: post.slug }));
}

export const alt = '의정부 건강·생활 정보 포털';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPostData(slug);
  const title = post?.title || '의정부 시민들을 위한 맞춤 혜택 가이드';
  const category = Array.isArray(post?.category) ? post.category[0] : post?.category || '의정부 생활정보';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#09090b',
          backgroundImage: 'linear-gradient(135deg, #09090b 0%, #18181b 50%, #27272a 100%)',
          padding: '48px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#ffffff',
            width: '100%',
            height: '100%',
            borderRadius: '0px',
            border: '2px solid #e4e4e7',
            padding: '50px 60px',
            boxShadow: '0 0 50px rgba(0,0,0,0.6)',
          }}
        >
          {/* 상단 카테고리 뱃지 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
            }}
          >
            <div
              style={{
                backgroundColor: '#18181b',
                color: '#ffffff',
                padding: '8px 20px',
                fontSize: '18px',
                fontWeight: '800',
                letterSpacing: '0.04em',
              }}
            >
              {category}
            </div>
            <div
              style={{
                fontSize: '18px',
                fontWeight: '700',
                color: '#71717a',
              }}
            >
              의정부 건강·생활 정보 포털
            </div>
          </div>

          {/* 중앙 글 제목 */}
          <div
            style={{
              fontSize: '50px',
              fontWeight: '900',
              color: '#09090b',
              textAlign: 'center',
              lineHeight: 1.35,
              wordBreak: 'keep-all',
              letterSpacing: '-0.03em',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1,
              padding: '0 20px',
            }}
          >
            {title}
          </div>

          {/* 하단 푸터 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              borderTop: '1px solid #f4f4f5',
              paddingTop: '20px',
            }}
          >
            <div style={{ fontSize: '18px', fontWeight: '800', color: '#18181b' }}>
              uijeongbusim.com
            </div>
            <div style={{ fontSize: '16px', fontWeight: '600', color: '#047857' }}>
              의정부 생활·의료 안내
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
