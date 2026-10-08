import { Metadata } from 'next';
import LearningFinderClient from '@/components/learning/LearningFinderClient';
import { SITE_URL, SITE_NAME } from '@/lib/constants';
import { getLearningData } from '@/lib/learning';

export const metadata: Metadata = {
  title: '양주시 평생학습 강좌 지도 & 수강신청 파인더 | 양주 건강·생활 정보 포털',
  description: '양주시 평생학습포털 공식 연동! 도서관, 주민센터, 평생학습관의 실시간 접수중 강좌를 지도와 1초 필터로 바로 검색하고 신청하세요.',
  alternates: {
    canonical: `${SITE_URL}/services/learning`,
  },
  openGraph: {
    title: '양주시 평생학습 강좌 지도 & 실시간 수강신청 파인더',
    description: '내 집 앞 10분 거리의 무료 강좌와 주말·야간 직장인 배움 강좌를 지도에서 1초 만에 확인하세요.',
    url: `${SITE_URL}/services/learning`,
    siteName: SITE_NAME,
    locale: 'ko_KR',
    type: 'website',
  },
};

export default function LearningPage() {
  const data = getLearningData();

  return (
    <div className="pb-12">
      <LearningFinderClient
        initialCourses={data.courses}
        updatedAt={data.updatedAt}
      />
    </div>
  );
}
