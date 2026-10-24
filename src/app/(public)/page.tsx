import { getSortedPostsData } from '@/lib/posts';
import { getLearningData } from '@/lib/learning';
import { Metadata } from 'next';
import EmergencyBanner from '@/components/emergency/EmergencyBanner';
import LearningBanner from '@/components/learning/LearningBanner';
import AppIcon from '@/components/ui/AppIcon';
import CivicCategorySection from '@/components/CivicCategorySection';

export const metadata: Metadata = {
  alternates: {
    canonical: '/',
  },
};

export default async function Home() {
  const posts = getSortedPostsData();
  const { totalCount: totalCourses } = getLearningData();

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* 1. 에디토리얼 히어로 헤더 */}
      <section className="space-y-2">
        <div className="inline-flex items-center gap-1.5 rounded-none bg-[#fffdfa] dark:bg-zinc-800 border border-[#e1dbd1] dark:border-zinc-700 px-3.5 py-1 text-[11px] font-bold tracking-wider text-sky-700 dark:text-sky-300">
          <AppIcon name="sparkles" size={13} strokeWidth={2.2} />
          <span>YANGJU LOCAL GUIDE · 양주 생활 큐레이션</span>
        </div>
        <h1 className="text-2xl sm:text-3xl lg:text-[34px] font-extrabold tracking-tight text-[#292722] dark:text-white leading-[1.25]">
          오늘 양주에서 꼭 챙겨야 할 혜택과 일상의 기록
        </h1>
        <p className="text-sm sm:text-[15px] text-[#5b554e] dark:text-zinc-400 leading-relaxed max-w-3xl">
          시청 공식 행정 소식부터 지원금·문화공연·평생학습·24시 응급의료까지 시민의 하루에 필요한 정보만 정갈하게 모았습니다.
        </p>
      </section>

      {/* 2. 핵심 공공서비스 퀵 배너 2종 (응급의료 지도 + 평생학습 실시간 강좌 지도) */}
      <div className="grid grid-cols-1 gap-3 sm:gap-4">
        <EmergencyBanner />
        <LearningBanner totalCourses={totalCourses} />
      </div>

      {/* 3. 네이버형 분야별 대제목-하위탭-포스팅 허브 (최상단 브리핑 + 1순위 공연 섹션) */}
      <CivicCategorySection posts={posts} />
    </div>
  );
}
