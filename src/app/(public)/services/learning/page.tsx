import fs from 'fs';
import path from 'path';
import { Metadata } from 'next';
import LearningFinderClient, { CourseItem } from '@/components/learning/LearningFinderClient';
import { SITE_URL, SITE_NAME } from '@/lib/constants';

export const metadata: Metadata = {
  title: '의정부시 평생학습 강좌 지도 & 수강신청 파인더 | 의정부 건강·생활 정보 포털',
  description: '의정부시 평생학습 통합플랫폼(뉴런) 공식 연동! 도서관, 주민센터, 청소년수련관의 실시간 접수중 강좌를 지도와 1초 필터로 바로 검색하고 신청하세요.',
  alternates: {
    canonical: `${SITE_URL}/services/learning`,
  },
  openGraph: {
    title: '의정부시 평생학습 강좌 지도 & 실시간 수강신청 파인더',
    description: '내 집 앞 10분 거리의 무료 강좌와 주말·야간 직장인 배움 강좌를 지도에서 1초 만에 확인하세요.',
    url: `${SITE_URL}/services/learning`,
    siteName: SITE_NAME,
    locale: 'ko_KR',
    type: 'website',
  },
};

interface LearningData {
  updatedAt: string;
  totalCount: number;
  courses: CourseItem[];
}

function getLearningData(): LearningData {
  try {
    const filePath = path.join(process.cwd(), 'src/data/learning-courses.json');
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(content);
    }
  } catch (e) {
    console.error('Failed to load learning courses data:', e);
  }
  return { updatedAt: '', totalCount: 0, courses: [] };
}

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
