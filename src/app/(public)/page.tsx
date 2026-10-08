import fs from 'fs';
import path from 'path';
import { getSortedPostsData } from '@/lib/posts';
import { Metadata } from 'next';
import Image from 'next/image';
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
  let totalCourses = 0;
  try {
    const lPath = path.join(process.cwd(), 'src/data/learning-courses.json');
    if (fs.existsSync(lPath)) {
      totalCourses = JSON.parse(fs.readFileSync(lPath, 'utf8')).totalCount || 0;
    }
  } catch {}

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* 1. 메인 인트로 헤더 (보상스쿨 Google Material 스타일) */}
      <div className="relative overflow-hidden rounded-none border border-gray-200/90 dark:border-zinc-800 bg-white dark:bg-[#202124] shadow-[0_2px_8px_rgba(0,0,0,0.03)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.2)] hover:shadow-md p-6 sm:p-8 lg:p-10 group transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-blue-50/10 to-transparent dark:from-blue-950/20 dark:via-blue-950/5 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-0" />

        {/* 우측 배경 수묵 워터마크 (SVG) */}
        <div className="absolute -right-6 -bottom-6 text-zinc-900/[0.035] dark:text-zinc-100/[0.055] pointer-events-none transition-transform duration-500 group-hover:scale-105 z-0">
          <AppIcon name="compass" size={190} strokeWidth={1.5} />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-8 lg:gap-12">
          {/* 텍스트 영역 */}
          <div className="flex-1 text-center lg:text-left order-2 lg:order-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#e8f0fe] text-[var(--google-blue)] dark:bg-[#174ea6]/20 dark:text-[#8ab4f8] text-xs font-bold uppercase tracking-wider mb-4 border border-[#d2e3fc]/60 dark:border-[#174ea6]/40 rounded-none shadow-xs">
              <AppIcon name="shield-check" size={14} strokeWidth={2} />
              <span>의정부시 생활·의료·교육 정보 포털</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.2] text-[#202124] dark:text-white">
              의정부 <br className="hidden sm:block lg:hidden" />
              <span className="bg-gradient-to-r from-[#0d47a1] to-[#1a73e8] dark:from-[#8ab4f8] dark:to-[#aecbfa] bg-clip-text text-transparent">건강·생활 정보 포털</span>
            </h1>
            <p className="mt-3 text-sm sm:text-base text-zinc-600 dark:text-zinc-400 font-normal break-keep max-w-xl leading-relaxed">
              의정부 응급실 위치와 평생학습 실시간 강좌, 국가건강검진·민원 안내를 한눈에 확인하세요.
            </p>
          </div>

          {/* 로고 영역 */}
          <div className="shrink-0 order-1 lg:order-2 relative">
            <div className="relative w-28 h-28 sm:w-36 sm:h-36 flex items-center justify-center">
              <Image
                src="/images/uijeongbu-logo.png"
                alt="의정부시 로고"
                fill
                className="object-contain p-2"
                sizes="(max-width: 1024px) 144px, 180px"
                priority
              />
            </div>
          </div>
        </div>
      </div>

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
