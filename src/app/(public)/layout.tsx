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
      <ScrollProgressBar />

      {/* 1. 프리미엄 패밀리룩 헤더 */}
      <header className="sticky top-0 z-50 w-full h-[64px] bg-white/95 dark:bg-[#202124]/95 backdrop-blur-md border-b border-gray-200/80 dark:border-zinc-800 transition-colors shadow-xs">
        <div className="mx-auto flex h-full w-[92vw] xl:w-[85vw] max-w-7xl items-center justify-between px-2 sm:px-5">
          {/* 로고/제목 영역 */}
          <div className="flex items-center min-w-0 flex-1 mr-1 sm:mr-2">
            <div className="font-sans font-extrabold text-lg sm:text-xl min-w-0 tracking-tight">
              <Link href="/" className="group flex items-center gap-2 sm:gap-2.5 whitespace-nowrap overflow-hidden">
                <div className="relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 shrink-0 group-hover:-translate-y-0.5 transition-transform duration-200 z-10 overflow-hidden">
                  <Image
                    src="/images/uijeongbu-logo.png"
                    alt="의정부 행복특별시 로고"
                    fill
                    className="object-contain"
                    sizes="40px"
                    priority
                  />
                </div>
                <span className="hidden sm:inline font-extrabold text-xl text-gray-900 dark:text-white truncate tracking-tight">
                  의정부 건강·생활 정보 포털
                </span>
                <span className="sm:hidden font-extrabold text-lg text-gray-900 dark:text-white truncate tracking-tight">
                  의정부 생활정보
                </span>
                <span className="hidden lg:inline-flex items-center px-2 py-0.5 ml-1.5 bg-zinc-100 dark:bg-zinc-800 text-[10px] font-extrabold text-zinc-900 dark:text-zinc-100 tracking-wider uppercase border border-zinc-200 dark:border-zinc-700 rounded-none">
                  Uijeongbu
                </span>
              </Link>
            </div>
          </div>

          {/* 우측 메뉴 영역 */}
          <div className="flex items-center gap-2 shrink-0">
            <SearchBar />
            <nav className="hidden md:flex items-center space-x-1.5">
              <Link
                href="/"
                className="p-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all rounded-none flex items-center justify-center group cursor-pointer"
                aria-label="홈"
                title="홈"
              >
                <AppIcon name="home" size={20} />
              </Link>
              <Link
                href="/blog"
                className="p-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all rounded-none flex items-center justify-center group cursor-pointer"
                aria-label="생활소식"
                title="생활 가이드"
              >
                <AppIcon name="list" size={20} />
              </Link>
            </nav>
            <div className="flex items-center gap-1 ml-1">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* 2. 의정부 포털 스마트 2열 스티키 레이아웃 (본문 72% + 사이드바 28%) */}
      <SmartStickyLayout
        mainContent={children}
        sidebarContent={<SidebarContent tags={sortedTags} recentPosts={posts.slice(0, 4)} categories={categories} />}
      />

      {/* 3. 푸터 */}
      <footer className="mt-auto w-full bg-white dark:bg-[#202124] text-zinc-700 dark:text-zinc-300 border-t border-gray-200/80 dark:border-zinc-800 pb-[calc(64px+env(safe-area-inset-bottom))] lg:pb-0">
        <div className="mx-auto flex flex-col md:flex-row h-auto md:h-[70px] w-[92vw] xl:w-[85vw] max-w-7xl items-center justify-between px-2 sm:px-5 py-5 md:py-0 text-xs font-medium gap-3">
          <p className="copyright text-center md:text-left flex items-center gap-1.5">
            © {new Date().getFullYear()} 의정부 건강·생활 정보 포털. All rights reserved.
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
