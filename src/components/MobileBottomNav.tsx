'use client';

import { useState, useEffect, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import BottomSheet from '@/components/ui/BottomSheet';
import MenuCard, { type MenuCardProps } from '@/components/ui/MenuCard';
import AppIcon from '@/components/ui/AppIcon';
import { getCategoryIcon } from '@/lib/constants';

type ModalType = 'none' | 'home' | 'emergency' | 'learning' | 'civic' | 'categories';

// ── [의정부심 클린 & 프리미엄] 선언형 모바일 퀵 허브 데이터셋 (보상스쿨 SSOT 규격) ──

const HOME_ITEMS: MenuCardProps[] = [
  {
    href: '/',
    icon: <AppIcon name="home" size={20} strokeWidth={2.2} />,
    title: '의정부 포털 메인 홈',
    themeColor: 'blue',
    badgeText: '메인',
    description: '의정부시 복지·지원금, 보건소, 생활 소식 종합 첫 화면',
    buttonText: '포털 메인 홈으로 이동',
    watermarkIcon: 'home',
  },
  {
    href: '/blog',
    icon: <AppIcon name="file-text" size={20} strokeWidth={2.2} />,
    title: '생활 가이드 전체글',
    themeColor: 'green',
    badgeText: '전체보기',
    description: '시민 맞춤형 복지·행정·지원금 심층 가이드 칼럼 전체 목록',
    buttonText: '전체 포스팅 칼럼 보러가기',
    watermarkIcon: 'file-text',
  },
  {
    href: '/search',
    icon: <AppIcon name="search" size={20} strokeWidth={2.2} />,
    title: '스마트 통합 검색',
    themeColor: 'indigo',
    badgeText: '원스톱',
    description: '지원금 공고, 평생학습 강좌, 복지 혜택을 키워드로 즉시 검색',
    buttonText: '포털 통합 검색창 열기',
    watermarkIcon: 'search',
  },
];

const EMERGENCY_ITEMS: MenuCardProps[] = [
  {
    href: '/services/emergency',
    icon: <AppIcon name="hospital" size={20} strokeWidth={2.2} />,
    title: '24시간 응급실·병원 지도',
    themeColor: 'green',
    badgeText: '실시간 지도',
    description: '의정부 관내 24시 응급실, 달빛어린이병원, 심야약국 위치 및 전화 연결',
    buttonText: '응급의료 지도 열기',
    watermarkIcon: 'hospital',
  },
  {
    href: 'https://www.ui4u.go.kr/health/main.do',
    icon: <AppIcon name="heart" size={20} strokeWidth={2.2} />,
    title: '의정부시 보건소 (공식)',
    themeColor: 'rose',
    badgeText: '예방·진료',
    description: '국가 무료 예방접종, 생애주기별 건강검진, 모자보건 및 만성질환 관리',
    buttonText: '보건소 공식 홈페이지 방문',
    watermarkIcon: 'heart',
  },
  {
    href: 'https://www.e-gen.or.kr',
    icon: <AppIcon name="shield-check" size={20} strokeWidth={2.2} />,
    title: '중앙응급의료센터 E-Gen',
    themeColor: 'blue',
    badgeText: '보건복지부',
    description: '보건복지부 지정 전국 실시간 야간·휴일 진료기관 및 응급 병상 정보',
    buttonText: 'E-Gen 응급의료포털 열기',
    watermarkIcon: 'shield-check',
  },
];

const LEARNING_ITEMS: MenuCardProps[] = [
  {
    href: '/services/learning',
    icon: <AppIcon name="book" size={20} strokeWidth={2.2} />,
    title: '의정부 평생학습 실시간 강좌',
    themeColor: 'blue',
    badgeText: '접수중 강좌',
    description: '의정부시 평생학습원 실시간 개설 강좌 수강료, 일정, 접수 방법 안내',
    buttonText: '개설 강좌 리스트 확인',
    watermarkIcon: 'book',
  },
  {
    href: 'https://www.ull.or.kr/lifeedu/index.do',
    icon: <AppIcon name="landmark" size={20} strokeWidth={2.2} />,
    title: '의정부 평생학습포털 (공식)',
    themeColor: 'yellow',
    badgeText: '공식 접수처',
    description: '의정부시민 무료·유료 시민대학, 자격증, 취미 교양 온라인 수강신청',
    buttonText: '평생학습포털 공식 사이트 방문',
    watermarkIcon: 'landmark',
  },
  {
    href: 'https://www.uilib.go.kr',
    icon: <AppIcon name="book" size={20} strokeWidth={2.2} />,
    title: '의정부시 도서관 포털',
    themeColor: 'teal',
    badgeText: '도서·문화',
    description: '의정부 관내 시립 도서관 소장 도서 검색, 대출·예약 및 문화 프로그램',
    buttonText: '의정부 도서관 방문',
    watermarkIcon: 'book',
  },
];

const CIVIC_ITEMS: MenuCardProps[] = [
  {
    href: 'https://www.ui4u.go.kr/cscportal/main.do',
    icon: <AppIcon name="landmark" size={20} strokeWidth={2.2} />,
    title: '동 행정복지센터 (생활민원)',
    themeColor: 'blue',
    badgeText: '민원 발급',
    description: '주민등록 등초본, 전입신고, 복지 급여 신청 및 동별 관할 구역 안내',
    buttonText: '행정복지센터 포털 방문',
    watermarkIcon: 'landmark',
  },
  {
    href: 'https://www.ui4u.go.kr/tour/main.do',
    icon: <AppIcon name="compass" size={20} strokeWidth={2.2} />,
    title: '의정부 문화관광 포털',
    themeColor: 'indigo',
    badgeText: '축제·명소',
    description: '의정부 대표 축제, 소풍길, 부대찌개거리, 명소 및 주말 나들이 명소',
    buttonText: '문화관광 포털 방문',
    watermarkIcon: 'compass',
  },
  {
    href: 'tel:031-828-2114',
    icon: <AppIcon name="phone" size={20} strokeWidth={2.2} />,
    title: '의정부시 대표 콜센터',
    themeColor: 'green',
    badgeText: '031-828-2114',
    description: '시정 문의, 생활 불편 신고, 당직실 연결을 위한 원스톱 전화 연결',
    buttonText: '대표 콜센터 즉시 전화 걸기',
    watermarkIcon: 'phone',
  },
];

interface MobileBottomNavProps {
  categories?: string[];
}

function NavContent({ categories = [] }: { categories?: string[] }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category');
  const [openModal, setOpenModal] = useState<ModalType>('none');

  const closeModals = () => setOpenModal('none');

  useEffect(() => {
    closeModals();
  }, [pathname, searchParams]);

  const navTabs = [
    {
      id: 'home' as const,
      label: '홈',
      onClick: () => setOpenModal(openModal === 'home' ? 'none' : 'home'),
      iconName: 'home' as const,
      isOpen: openModal === 'home',
      isRouteActive: pathname === '/' && !categoryParam && openModal === 'none',
    },
    {
      id: 'emergency' as const,
      label: '응급의료',
      onClick: () => setOpenModal(openModal === 'emergency' ? 'none' : 'emergency'),
      iconName: 'hospital' as const,
      isOpen: openModal === 'emergency',
      isRouteActive: pathname.startsWith('/services/emergency') && openModal === 'none',
    },
    {
      id: 'learning' as const,
      label: '평생학습',
      onClick: () => setOpenModal(openModal === 'learning' ? 'none' : 'learning'),
      iconName: 'book' as const,
      isOpen: openModal === 'learning',
      isRouteActive: pathname.startsWith('/services/learning') && openModal === 'none',
    },
    {
      id: 'civic' as const,
      label: '시민행정',
      onClick: () => setOpenModal(openModal === 'civic' ? 'none' : 'civic'),
      iconName: 'landmark' as const,
      isOpen: openModal === 'civic',
      isRouteActive: false,
    },
    {
      id: 'categories' as const,
      label: '생활분야',
      onClick: () => setOpenModal(openModal === 'categories' ? 'none' : 'categories'),
      iconName: 'compass' as const,
      isOpen: openModal === 'categories',
      isRouteActive: (pathname.startsWith('/blog') || !!categoryParam) && openModal === 'none',
    },
  ];

  return (
    <>
      {/* ── 1. [홈 모달] 메인 홈 + 생활 가이드 전체글 + 스마트 통합검색 ── */}
      <BottomSheet isOpen={openModal === 'home'} onClose={closeModals} maxHeight="max-h-[85vh]">
        <h3 className="font-extrabold text-base text-[#202124] dark:text-white mb-3">
          의정부 생활정보 포털
        </h3>
        <div className="space-y-3">
          {HOME_ITEMS.map((item, idx) => (
            <MenuCard key={idx} {...item} onClick={closeModals} />
          ))}
        </div>
      </BottomSheet>

      {/* ── 2. [응급의료 모달] 24시 응급실 지도 + 보건소 + E-Gen ── */}
      <BottomSheet isOpen={openModal === 'emergency'} onClose={closeModals} maxHeight="max-h-[85vh]">
        <h3 className="font-extrabold text-base text-[#202124] dark:text-white mb-3">
          24시간 응급의료 & 병원
        </h3>
        <div className="space-y-3">
          {EMERGENCY_ITEMS.map((item, idx) => (
            <MenuCard key={idx} {...item} onClick={closeModals} />
          ))}
        </div>
      </BottomSheet>

      {/* ── 3. [평생학습 모달] 실시간 강좌 접수 + 평생학습포털 + 도서관 ── */}
      <BottomSheet isOpen={openModal === 'learning'} onClose={closeModals} maxHeight="max-h-[85vh]">
        <h3 className="font-extrabold text-base text-[#202124] dark:text-white mb-3">
          평생학습 & 시민 강좌
        </h3>
        <div className="space-y-3">
          {LEARNING_ITEMS.map((item, idx) => (
            <MenuCard key={idx} {...item} onClick={closeModals} />
          ))}
        </div>
      </BottomSheet>

      {/* ── 4. [시민행정 모달] 동 행정복지센터 + 문화관광 + 대표 콜센터 ── */}
      <BottomSheet isOpen={openModal === 'civic'} onClose={closeModals} maxHeight="max-h-[85vh]">
        <h3 className="font-extrabold text-base text-[#202124] dark:text-white mb-3">
          시민 편의 & 행정 서비스
        </h3>
        <div className="space-y-3">
          {CIVIC_ITEMS.map((item, idx) => (
            <MenuCard key={idx} {...item} onClick={closeModals} />
          ))}
        </div>
      </BottomSheet>

      {/* ── 5. [생활분야 모달] 8대 행정 카테고리 전체 그리드 ── */}
      <BottomSheet isOpen={openModal === 'categories'} onClose={closeModals} maxHeight="max-h-[85vh]">
        <div className="w-full flex flex-col">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100 dark:border-zinc-800">
            <h3 className="text-sm sm:text-base font-extrabold text-[#202124] dark:text-white">
              의정부 8대 생활정보 카테고리
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700">
              분야별 가이드
            </span>
          </div>

          {categories.length > 0 ? (
            <div className="grid grid-cols-2 gap-2.5">
              {categories.map((catName) => {
                const icon = getCategoryIcon(catName);
                const isCurrentCat = categoryParam === catName;
                return (
                  <Link
                    key={catName}
                    href={`/blog?category=${encodeURIComponent(catName)}`}
                    onClick={closeModals}
                    className={`relative overflow-hidden flex items-center gap-2.5 p-3 rounded-none border transition-all group shadow-2xs ${
                      isCurrentCat
                        ? 'bg-blue-50/80 dark:bg-blue-950/40 border-[var(--google-blue)] text-[var(--google-blue)] dark:text-[#8ab4f8]'
                        : 'bg-white dark:bg-[#202124] border-gray-200/90 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 text-zinc-900 dark:text-zinc-100'
                    }`}
                  >
                    <div className="absolute right-1 bottom-0 opacity-[0.05] dark:opacity-[0.08] text-zinc-900 dark:text-zinc-100 select-none pointer-events-none group-hover:scale-110 transition-transform duration-300 z-0">
                      <AppIcon name={icon} size={44} strokeWidth={1.5} />
                    </div>

                    <AppIcon
                      name={icon}
                      size={16}
                      strokeWidth={2.2}
                      className={`relative z-10 shrink-0 ${
                        isCurrentCat
                          ? 'text-[var(--google-blue)] dark:text-[#8ab4f8]'
                          : 'text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white'
                      }`}
                    />
                    <span className="font-extrabold text-xs tracking-tight truncate relative z-10">
                      {catName}
                    </span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-gray-400">
              카테고리 목록을 불러오는 중...
            </div>
          )}

          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-zinc-800 flex items-center gap-2">
            <Link
              href="/blog"
              onClick={closeModals}
              className="flex-1 py-2.5 px-3 bg-gray-50 dark:bg-zinc-800/80 hover:bg-gray-100 dark:hover:bg-zinc-800 text-center font-bold text-xs text-zinc-800 dark:text-zinc-200 border border-gray-200/80 dark:border-zinc-700 transition-colors"
            >
              전체글 목록 보기
            </Link>
            <Link
              href="/search"
              onClick={closeModals}
              className="flex-1 py-2.5 px-3 bg-[var(--google-blue)] text-white text-center font-bold text-xs transition-opacity hover:opacity-90 shadow-sm"
            >
              키워드 검색
            </Link>
          </div>
        </div>
      </BottomSheet>

      {/* ── 6. 하단 5대 탭 바 ── */}
      <nav className="lg:hidden fixed bottom-0 left-0 w-full h-[60px] bg-white/95 dark:bg-[#202124]/95 backdrop-blur-md border-t border-gray-200/90 dark:border-zinc-800 flex items-center justify-around px-1 z-[100] pb-[env(safe-area-inset-bottom)] transition-colors duration-300 shadow-md">
        {navTabs.map((tab) => {
          const isActive = tab.isOpen || tab.isRouteActive;
          return (
            <button
              key={tab.id}
              onClick={tab.onClick}
              type="button"
              className={`relative flex flex-col items-center justify-center w-full h-full transition-all active:scale-95 cursor-pointer ${
                isActive
                  ? 'text-[var(--google-blue)] dark:text-[#8ab4f8] font-bold'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2.5px] bg-[var(--google-blue)] dark:bg-[#8ab4f8] rounded-none animate-in fade-in duration-200" />
              )}
              <AppIcon
                name={tab.iconName}
                size={21}
                strokeWidth={isActive ? 2.5 : 1.9}
                className="mb-0.5"
              />
              <span className={`text-[10px] sm:text-[10.5px] tracking-tight ${isActive ? 'font-bold' : 'font-medium'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
}

export default function MobileBottomNav({ categories = [] }: MobileBottomNavProps) {
  return (
    <Suspense
      fallback={
        <div className="lg:hidden fixed bottom-0 left-0 w-full h-[60px] bg-white/95 dark:bg-[#202124]/95 backdrop-blur-md border-t border-gray-200/90 dark:border-zinc-800 z-[100]" />
      }
    >
      <NavContent categories={categories} />
    </Suspense>
  );
}
