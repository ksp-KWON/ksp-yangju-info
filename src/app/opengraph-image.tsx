import { ImageResponse } from 'next/og';

export const dynamic = 'force-static';

export const alt = '의정부 건강·생활 정보 포털';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
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
            padding: '56px 64px',
            boxShadow: '0 0 50px rgba(0,0,0,0.6)',
          }}
        >
          {/* 상단 뱃지 영역 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#047857',
              color: '#ffffff',
              padding: '10px 24px',
              fontSize: '20px',
              fontWeight: '800',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}
          >
            의정부시 생활·의료 정보 포털
          </div>

          {/* 중앙 메인 타이틀 */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: '60px',
                fontWeight: '900',
                color: '#09090b',
                letterSpacing: '-0.03em',
                marginBottom: '16px',
              }}
            >
              의정부 건강·생활 정보 포털
            </div>
            <div
              style={{
                fontSize: '28px',
                fontWeight: '600',
                color: '#52525b',
                letterSpacing: '-0.01em',
              }}
            >
              응급실 · 국가건강검진 · 민원 안내
            </div>
          </div>

          {/* 하단 푸터 바 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              borderTop: '1px solid #f4f4f5',
              paddingTop: '24px',
            }}
          >
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#18181b' }}>
              uijeongbusim.com
            </div>
            <div style={{ fontSize: '18px', fontWeight: '600', color: '#71717a' }}>
              의정부시 생활·의료 정보 안내
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
