import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import ThemeToggle from '@/components/ThemeToggle';
import SearchBar from '@/components/SearchBar';
import MobileBottomNav from '@/components/MobileBottomNav';
import ScrollProgressBar from '@/components/ScrollProgressBar';
import SmartStickyLayout from '@/components/SmartStickyLayout';
import SidebarContent from '@/components/SidebarContent';
import { ThemeProvider } from '@/components/ThemeProvider';
import AppIcon from '@/components/ui/AppIcon';
import { getSortedPostsData, getActiveCategories } from '@/lib/posts';

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 서버에서 전체 태그 목록 사전 계산 → 사이드바에 정적 주입 (초고속 렌더링)
  const posts = getSortedPostsData();
  const categories = getActiveCategories();
  const tagCounts: Record<string, number> = {};
  for (const post of posts) {
    if (post.tags) {
      for (const tag of post.tags) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      }
    }
  }
  const sortedTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([tag]) => tag);

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      {/* W3C WCAG 2.1 AA & 전자정부 웹 접근성 표준: 본문 건너뛰기 링크 */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[9999] focus:px-4 focus:py-2.5 focus:bg-zinc-950 focus:text-white dark:focus:bg-white dark:focus:text-zinc-950 focus:font-bold focus:text-sm focus:border focus:border-zinc-700 focus:shadow-xl focus:outline-none"
      >
        본문 바로가기
      </a>

      <ScrollProgressBar />

      {/* 1. 에디토리얼 프리미엄 헤더 & 상단 GNB */}
      <header className="sticky top-0 z-50 w-full h-[72px] bg-[#faf8f4]/95 dark:bg-[#202124]/95 backdrop-blur-xl border-b border-[#e1dbd1]/80 dark:border-zinc-800 transition-colors">
        <div className="mx-auto flex h-full w-[92vw] xl:w-[85vw] max-w-7xl items-center justify-between px-2 sm:px-5">
          {/* 로고/브랜드 영역 (2단 계층) */}
          <div className="flex items-center min-w-0 shrink-0 mr-2 sm:mr-3">
            <Link href="/" className="group flex items-center gap-2 sm:gap-2.5 whitespace-nowrap overflow-hidden">
              <div className="relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 shrink-0 group-hover:-translate-y-0.5 transition-transform duration-200 z-10 overflow-hidden">
                <Image
                  src="/images/yangju-logo.svg"
                  alt="도약진흥 양주시 로고"
                  fill
                  className="object-contain"
                  sizes="40px"
                  priority
                />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-base sm:text-lg font-extrabold tracking-[-0.04em] text-[#292722] dark:text-white leading-none">
                  양주인
                </span>
                <span className="mt-1 text-[8.5px] font-semibold tracking-[0.18em] text-[#716b63] dark:text-zinc-400 uppercase">
                  YANGJU LOCAL GUIDE
                </span>
              </div>
            </Link>
          </div>

          {/* 중앙 GNB 내비게이션 (알약형 8종) */}
          <nav aria-label="주요 메뉴" className="hidden lg:flex items-center gap-0.5 mx-4">
            <Link
              href="/"
              className="inline-flex min-h-9 items-center rounded-full px-3 text-[13px] font-semibold text-[#5b554e] dark:text-zinc-300 transition-colors hover:bg-[#ebe5da]/70 dark:hover:bg-zinc-800 hover:text-[#292722] dark:hover:text-white whitespace-nowrap"
            >
              홈
            </Link>
            <Link
              href="/blog?category=복지·돌봄"
              className="inline-flex min-h-9 items-center rounded-full px-3 text-[13px] font-semibold text-[#5b554e] dark:text-zinc-300 transition-colors hover:bg-[#ebe5da]/70 dark:hover:bg-zinc-800 hover:text-[#292722] dark:hover:text-white whitespace-nowrap"
            >
              복지·지원금
            </Link>
            <Link
              href="/blog?category=문화·예술"
              className="inline-flex min-h-9 items-center rounded-full px-3 text-[13px] font-semibold text-[#5b554e] dark:text-zinc-300 transition-colors hover:bg-[#ebe5da]/70 dark:hover:bg-zinc-800 hover:text-[#292722] dark:hover:text-white whitespace-nowrap"
            >
              문화·행사
            </Link>
            <Link
              href="/blog?category=일자리·생활"
              className="inline-flex min-h-9 items-center rounded-full px-3 text-[13px] font-semibold text-[#5b554e] dark:text-zinc-300 transition-colors hover:bg-[#ebe5da]/70 dark:hover:bg-zinc-800 hover:text-[#292722] dark:hover:text-white whitespace-nowrap"
            >
              일자리·생활
            </Link>
            <Link
              href="/blog?category=교통·주차"
              className="inline-flex min-h-9 items-center rounded-full px-3 text-[13px] font-semibold text-[#5b554e] dark:text-zinc-300 transition-colors hover:bg-[#ebe5da]/70 dark:hover:bg-zinc-800 hover:text-[#292722] dark:hover:text-white whitespace-nowrap"
            >
              교통·환경
            </Link>
            <Link
              href="/services/learning"
              className="inline-flex min-h-9 items-center rounded-full px-3 text-[13px] font-semibold text-[#5b554e] dark:text-zinc-300 transition-colors hover:bg-[#ebe5da]/70 dark:hover:bg-zinc-800 hover:text-[#292722] dark:hover:text-white whitespace-nowrap"
            >
              평생학습
            </Link>
            <Link
              href="/services/emergency"
              className="inline-flex min-h-9 items-center rounded-full px-3 text-[13px] font-semibold text-[#5b554e] dark:text-zinc-300 transition-colors hover:bg-[#ebe5da]/70 dark:hover:bg-zinc-800 hover:text-[#292722] dark:hover:text-white whitespace-nowrap"
            >
              응급의료
            </Link>
            <Link
              href="/blog"
              className="inline-flex min-h-9 items-center rounded-full px-3 text-[13px] font-semibold text-[#5b554e] dark:text-zinc-300 transition-colors hover:bg-[#ebe5da]/70 dark:hover:bg-zinc-800 hover:text-[#292722] dark:hover:text-white whitespace-nowrap"
            >
              전체글
            </Link>
          </nav>

          {/* 우측 메뉴 영역 */}
          <div className="flex items-center gap-2 shrink-0">
            <SearchBar />
            <Link
              href="/blog"
              className="lg:hidden p-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-[#ebe5da]/60 dark:hover:bg-zinc-800 transition-all rounded-full flex items-center justify-center cursor-pointer"
              aria-label="전체글"
              title="전체글 목록"
            >
              <AppIcon name="list" size={19} />
            </Link>
            <div className="flex items-center gap-1 ml-1">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* 2. 양주 포털 스마트 2열 스티키 레이아웃 (본문 72% + 사이드바 28%) */}
      <SmartStickyLayout
        mainContent={children}
        sidebarContent={<SidebarContent tags={sortedTags} recentPosts={posts.slice(0, 4)} categories={categories} />}
      />

      {/* 3. 에디토리얼 푸터 */}
      <footer className="mt-auto w-full bg-[#f3efe8]/70 dark:bg-[#202124] text-zinc-700 dark:text-zinc-300 border-t border-[#e1dbd1]/80 dark:border-zinc-800 pb-[calc(64px+env(safe-area-inset-bottom))] lg:pb-0">
        <div className="mx-auto flex flex-col md:flex-row h-auto md:h-[70px] w-[92vw] xl:w-[85vw] max-w-7xl items-center justify-between px-2 sm:px-5 py-5 md:py-0 text-xs font-medium gap-3">
          <p className="copyright text-center md:text-left flex items-center gap-1.5">
            © {new Date().getFullYear()} 양주인 (양주 건강·생활 정보 포털). All rights reserved.
          </p>
          <p className="iagree text-center md:text-right flex items-center justify-center flex-wrap gap-3 font-semibold">
            <Link href="/about" className="hover:text-zinc-950 dark:hover:text-white hover:underline cursor-pointer transition-all">
              플랫폼 소개
            </Link>
            <span className="w-1 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-none"></span>
            <Link href="/terms" className="hover:text-zinc-950 dark:hover:text-white hover:underline cursor-pointer transition-all">
              이용약관
            </Link>
            <span className="w-1 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-none"></span>
            <Link href="/privacy" className="hover:text-zinc-950 dark:hover:text-white hover:underline cursor-pointer transition-all">
              개인정보처리방침
            </Link>
          </p>
        </div>
      </footer>

      {/* 모바일 하단 네비게이션 */}
      <MobileBottomNav categories={categories} />
    </ThemeProvider>
  );
}
