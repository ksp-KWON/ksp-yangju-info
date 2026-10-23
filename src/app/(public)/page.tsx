import { getSortedPostsData } from '@/lib/posts';
import { getLearningData } from '@/lib/learning';
import { Metadata } from 'next';
import Link from 'next/link';
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
      {/* 1. 에디토리얼 히어로 & 4대 상황별 북커버 큐레이션 */}
      <section className="space-y-4">
        {/* 상단 에디토리얼 타이틀 영역 */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#fffdfa] dark:bg-zinc-800 border border-[#e1dbd1] dark:border-zinc-700 px-3.5 py-1 text-[11px] font-bold tracking-wider text-sky-700 dark:text-sky-300">
            <AppIcon name="sparkles" size={13} strokeWidth={2.2} />
            <span>YANGJU LOCAL GUIDE · 양주 생활 큐레이션</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-[34px] font-extrabold tracking-tight text-[#292722] dark:text-white leading-[1.25]">
            오늘 양주에서 꼭 챙겨야 할 혜택과 일상의 기록
          </h1>
          <p className="text-sm sm:text-[15px] text-[#5b554e] dark:text-zinc-400 leading-relaxed max-w-3xl">
            시청 공식 행정 소식부터 지원금·문화공연·평생학습·24시 응급의료까지 시민의 하루에 필요한 정보만 정갈하게 모았습니다.
          </p>
        </div>

        {/* seoulcities.net 시그니처 4종 북커버 카드 그리드 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 mt-6">
          {/* NO. 01 */}
          <Link
            href={`/blog?category=${encodeURIComponent('복지·돌봄')}`}
            className="group block select-none"
          >
            <div className="editorial-cover-frame aspect-square p-4 sm:p-5 flex flex-col justify-between bg-gradient-to-br from-[#fdf2f0] to-[#f9e2de] dark:from-rose-950/50 dark:to-rose-900/30 text-rose-950 dark:text-rose-100 transition-transform duration-300 group-hover:-translate-y-1">
              <div className="flex items-center justify-between text-[10px] font-bold tracking-widest text-rose-800/80 dark:text-rose-300/80 uppercase">
                <span>YANGJU</span>
                <span>NO. 01</span>
              </div>
              <div className="my-auto py-2 text-center flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-white/70 dark:bg-zinc-900/50 text-rose-700 dark:text-rose-300 flex items-center justify-center mb-2 shadow-xs group-hover:scale-110 transition-transform">
                  <AppIcon name="bank" size={20} strokeWidth={2.2} />
                </div>
                <h3 className="font-serif font-bold text-base sm:text-lg text-rose-950 dark:text-white leading-tight">
                  놓치면 아쉬운 혜택
                </h3>
                <p className="text-[11px] text-rose-800/70 dark:text-rose-300/70 mt-1">
                  지원금·돌봄·의료 안내
                </p>
              </div>
              <div className="pt-2 border-t border-rose-200/60 dark:border-rose-900/60 flex items-center justify-between text-[11px] font-bold text-rose-700 dark:text-rose-300">
                <span>복지·돌봄</span>
                <span className="group-hover:translate-x-0.5 transition-transform">↗</span>
              </div>
            </div>
          </Link>

          {/* NO. 02 */}
          <Link
            href={`/blog?category=${encodeURIComponent('문화·예술')}`}
            className="group block select-none"
          >
            <div className="editorial-cover-frame aspect-square p-4 sm:p-5 flex flex-col justify-between bg-gradient-to-br from-[#eef6f8] to-[#dcecf2] dark:from-sky-950/50 dark:to-sky-900/30 text-sky-950 dark:text-sky-100 transition-transform duration-300 group-hover:-translate-y-1">
              <div className="flex items-center justify-between text-[10px] font-bold tracking-widest text-sky-800/80 dark:text-sky-300/80 uppercase">
                <span>YANGJU</span>
                <span>NO. 02</span>
              </div>
              <div className="my-auto py-2 text-center flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-white/70 dark:bg-zinc-900/50 text-sky-700 dark:text-sky-300 flex items-center justify-center mb-2 shadow-xs group-hover:scale-110 transition-transform">
                  <AppIcon name="party-popper" size={20} strokeWidth={2.2} />
                </div>
                <h3 className="font-serif font-bold text-base sm:text-lg text-sky-950 dark:text-white leading-tight">
                  함께 걷는 문화 일상
                </h3>
                <p className="text-[11px] text-sky-800/70 dark:text-sky-300/70 mt-1">
                  공연·전시·주말 나들이
                </p>
              </div>
              <div className="pt-2 border-t border-sky-200/60 dark:border-sky-900/60 flex items-center justify-between text-[11px] font-bold text-sky-700 dark:text-sky-300">
                <span>문화·예술</span>
                <span className="group-hover:translate-x-0.5 transition-transform">↗</span>
              </div>
            </div>
          </Link>

          {/* NO. 03 */}
          <Link
            href="/services/learning"
            className="group block select-none"
          >
            <div className="editorial-cover-frame aspect-square p-4 sm:p-5 flex flex-col justify-between bg-gradient-to-br from-[#fbf6ea] to-[#f3e6c8] dark:from-amber-950/50 dark:to-amber-900/30 text-amber-950 dark:text-amber-100 transition-transform duration-300 group-hover:-translate-y-1">
              <div className="flex items-center justify-between text-[10px] font-bold tracking-widest text-amber-800/80 dark:text-amber-300/80 uppercase">
                <span>YANGJU</span>
                <span>NO. 03</span>
              </div>
              <div className="my-auto py-2 text-center flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-white/70 dark:bg-zinc-900/50 text-amber-700 dark:text-amber-300 flex items-center justify-center mb-2 shadow-xs group-hover:scale-110 transition-transform">
                  <AppIcon name="book" size={20} strokeWidth={2.2} />
                </div>
                <h3 className="font-serif font-bold text-base sm:text-lg text-amber-950 dark:text-white leading-tight">
                  내일을 여는 배움터
                </h3>
                <p className="text-[11px] text-amber-800/70 dark:text-amber-300/70 mt-1">
                  평생학습·강좌·일자리
                </p>
              </div>
              <div className="pt-2 border-t border-amber-200/60 dark:border-amber-900/60 flex items-center justify-between text-[11px] font-bold text-amber-700 dark:text-amber-300">
                <span>실시간 강좌 {totalCourses}건</span>
                <span className="group-hover:translate-x-0.5 transition-transform">↗</span>
              </div>
            </div>
          </Link>

          {/* NO. 04 */}
          <Link
            href="/services/emergency"
            className="group block select-none"
          >
            <div className="editorial-cover-frame aspect-square p-4 sm:p-5 flex flex-col justify-between bg-gradient-to-br from-[#eef7f2] to-[#d8ede2] dark:from-emerald-950/50 dark:to-emerald-900/30 text-emerald-950 dark:text-emerald-100 transition-transform duration-300 group-hover:-translate-y-1">
              <div className="flex items-center justify-between text-[10px] font-bold tracking-widest text-emerald-800/80 dark:text-emerald-300/80 uppercase">
                <span>YANGJU</span>
                <span>NO. 04</span>
              </div>
              <div className="my-auto py-2 text-center flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-white/70 dark:bg-zinc-900/50 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mb-2 shadow-xs group-hover:scale-110 transition-transform">
                  <AppIcon name="hospital" size={20} strokeWidth={2.2} />
                </div>
                <h3 className="font-serif font-bold text-base sm:text-lg text-emerald-950 dark:text-white leading-tight">
                  365일 안심 생활망
                </h3>
                <p className="text-[11px] text-emerald-800/70 dark:text-emerald-300/70 mt-1">
                  24시 응급실·달빛병원
                </p>
              </div>
              <div className="pt-2 border-t border-emerald-200/60 dark:border-emerald-900/60 flex items-center justify-between text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                <span>실시간 응급의료</span>
                <span className="group-hover:translate-x-0.5 transition-transform">↗</span>
              </div>
            </div>
          </Link>
        </div>
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
