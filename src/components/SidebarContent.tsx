'use client';

/**
 * SidebarContent.tsx
 * 사이드바 컴포넌트 (Client Component)
 * - 1. 의정부 생활 퀵메뉴
 * - 2. 실시간 인기 키워드 태그
 * - 3. 보상스쿨 무료 보상 진단 비즈니스 배너
 * - 4. 의정부시 대표 콜센터
 */

import React, { useState } from 'react';
import Link from 'next/link';
import SidebarTagMore from './SidebarTagMore';
import PremiumCard from '@/components/ui/PremiumCard';
import AppIcon from '@/components/ui/AppIcon';
import { UIJEONGBU_TAXONOMY } from '@/data/uijeongbu-taxonomy';
import { PostData, PostMeta } from '@/lib/types';

interface SidebarContentProps {
  tags?: string[];
  recentPosts?: (PostMeta | PostData)[];
  categories?: string[];
}

const INITIAL_TAG_COUNT = 6;

const EXTERNAL_QUICK_LINKS = [
  {
    href: 'https://www.ui4u.go.kr/tour/main.do',
    title: '문화관광 포털',
    badge: '축제·명소',
    icon: 'compass' as const,
    containerClass: 'flex items-center justify-between gap-2 p-2 bg-indigo-50/80 hover:bg-indigo-100/80 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/50 border border-indigo-200/80 dark:border-indigo-800/80 transition-colors group/tour',
    iconBoxClass: 'bg-indigo-600 text-white',
    titleClass: 'text-indigo-950 dark:text-indigo-200',
    badgeClass: 'text-indigo-700 dark:text-indigo-300 bg-indigo-100/70 dark:bg-indigo-900/50',
  },
  {
    href: 'https://www.ui4u.go.kr/health/main.do',
    title: '의정부시 보건소',
    badge: '예방·진료',
    icon: 'heart' as const,
    containerClass: 'flex items-center justify-between gap-2 p-2 bg-rose-50/80 hover:bg-rose-100/80 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 border border-rose-200/80 dark:border-rose-800/80 transition-colors group/health',
    iconBoxClass: 'bg-rose-600 text-white',
    titleClass: 'text-rose-950 dark:text-rose-200',
    badgeClass: 'text-rose-700 dark:text-rose-300 bg-rose-100/70 dark:bg-rose-900/50',
  },
  {
    href: 'https://www.ui4u.go.kr/cscportal/main.do',
    title: '동 행정복지센터',
    badge: '생활민원',
    icon: 'landmark' as const,
    containerClass: 'flex items-center justify-between gap-2 p-2 bg-sky-50/80 hover:bg-sky-100/80 dark:bg-sky-950/40 dark:hover:bg-sky-900/50 border border-sky-200/80 dark:border-sky-800/80 transition-colors group/csc',
    iconBoxClass: 'bg-sky-600 text-white',
    titleClass: 'text-sky-950 dark:text-sky-200',
    badgeClass: 'text-sky-700 dark:text-sky-300 bg-sky-100/70 dark:bg-sky-900/50',
  },
  {
    href: 'https://www.ull.or.kr/lifeedu/index.do',
    title: '평생학습포털',
    badge: '시민강좌',
    icon: 'book' as const,
    containerClass: 'flex items-center justify-between gap-2 p-2 bg-amber-50/80 hover:bg-amber-100/80 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 border border-amber-200/80 dark:border-amber-800/80 transition-colors group/edu',
    iconBoxClass: 'bg-amber-600 text-white',
    titleClass: 'text-amber-950 dark:text-amber-200',
    badgeClass: 'text-amber-700 dark:text-amber-400 bg-amber-100/70 dark:bg-amber-900/50',
  },
];

export default function SidebarContent({ tags = [], recentPosts = [] }: SidebarContentProps) {
  const visibleTags = tags.slice(0, INITIAL_TAG_COUNT);
  const hiddenTags = tags.slice(INITIAL_TAG_COUNT);

  // 사이드바 생활 퀵메뉴 아코디언 상태
  const [openCategory, setOpenCategory] = useState<string | null>(null);

  const toggleCategory = (catName: string) => {
    setOpenCategory((prev) => (prev === catName ? null : catName));
  };

  return (
    <div className="space-y-4">
      {/* ── 1. 의정부 시민 퀵서비스 허브 (생활 퀵메뉴 아코디언) ── */}
      <PremiumCard borderColor="default" hoverEffect={false} watermarkIcon="compass" className="!p-4 sm:!p-5">
        {/* 카드 헤더 */}
        <div className="flex items-center justify-between min-w-0 gap-2 mb-3 pb-2 border-b border-gray-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <AppIcon name="compass" size={16} strokeWidth={2.5} className="text-zinc-900 dark:text-zinc-100" />
            <h3 className="text-xs sm:text-sm font-extrabold text-zinc-950 dark:text-white tracking-tight">
              의정부 생활 퀵메뉴
            </h3>
          </div>
          <span className="bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 text-[10px] font-bold px-1.5 py-0.5 border border-zinc-200 dark:border-zinc-700">
            분야별 탐색
          </span>
        </div>

        {/* 의정부 5대 핵심 생활 퀵메뉴 (가로형 컬러 배너 스택) */}
        <div className="space-y-1.5 mb-3">
          {/* 1. 24시간 응급실·병원 지도 (에메랄드) */}
          <Link
            href="/services/emergency"
            className="flex items-center justify-between gap-2 p-2 bg-emerald-50/80 hover:bg-emerald-100/80 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 border border-emerald-200/80 dark:border-emerald-800/80 transition-colors group/em"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="p-1 bg-emerald-600 text-white rounded-none shrink-0">
                <AppIcon name="hospital" size={13} strokeWidth={2.5} />
              </div>
              <span className="text-xs font-bold text-emerald-950 dark:text-emerald-200 truncate">
                24시간 응급실·병원 지도
              </span>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-900/60 px-1.5 py-0.5 shrink-0 flex items-center gap-0.5">
              <span>실시간</span>
              <AppIcon name="chevron-right" size={10} strokeWidth={2.5} />
            </span>
          </Link>

          {EXTERNAL_QUICK_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className={link.containerClass}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className={`p-1 ${link.iconBoxClass} rounded-none shrink-0`}>
                  <AppIcon name={link.icon} size={13} strokeWidth={2.5} />
                </div>
                <span className={`text-xs font-bold ${link.titleClass} truncate`}>
                  {link.title}
                </span>
              </div>
              <span className={`text-[10px] font-medium ${link.badgeClass} px-1.5 py-0.5 shrink-0 flex items-center gap-0.5`}>
                <span>{link.badge}</span>
                <AppIcon name="external-link" size={9} strokeWidth={2} />
              </span>
            </a>
          ))}
        </div>

        {/* 9대 행정 분야 아코디언 리스트 */}
        <div className="divide-y divide-gray-100 dark:divide-zinc-800/60">
          {UIJEONGBU_TAXONOMY.map((cat) => {
            const isOpen = openCategory === cat.name;

            return (
              <div key={cat.name} className="py-1">
                {/* 아코디언 헤더 버튼 */}
                <button
                  type="button"
                  onClick={() => toggleCategory(cat.name)}
                  className="w-full flex items-center justify-between gap-2 py-1.5 px-1 hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-colors text-left group/btn"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="p-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 group-hover/btn:bg-[var(--google-blue)] group-hover/btn:text-white transition-colors shrink-0">
                      <AppIcon name={cat.icon} size={13} strokeWidth={2.5} />
                    </div>
                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover/btn:text-[var(--google-blue)] dark:group-hover/btn:text-[#8ab4f8] truncate block">
                      {cat.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[9.5px] text-zinc-400 dark:text-zinc-500 font-medium">
                      {cat.subCategories.length}개 분야
                    </span>
                    <div className={`text-zinc-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                      <AppIcon name="chevron-down" size={13} strokeWidth={2.5} />
                    </div>
                  </div>
                </button>

                {/* 아코디언 확장 영역 (하위 카테고리 칩 및 링크) */}
                {isOpen && (
                  <div className="mt-1 mb-2 p-2 bg-zinc-50 dark:bg-zinc-900/70 border border-zinc-200/80 dark:border-zinc-800 space-y-1">
                    {cat.subCategories.map((sub) => (
                      <div
                        key={sub.id}
                        className="flex items-center justify-between gap-1.5 py-1 px-1.5 hover:bg-white dark:hover:bg-zinc-800 transition-colors text-[11.5px]"
                      >
                        <Link
                          href={`/blog?category=${encodeURIComponent(cat.name)}&subCategory=${encodeURIComponent(sub.name)}`}
                          className="font-bold text-zinc-700 dark:text-zinc-300 hover:text-[var(--google-blue)] dark:hover:text-[#8ab4f8] truncate flex-1 flex items-center gap-1.5"
                        >
                          <span className="w-1 h-1 bg-[var(--google-blue)] rounded-none shrink-0" />
                          <span className="truncate">{sub.shortName}</span>
                        </Link>
                        <a
                          href={sub.officialUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="시청 공식 누리집 새창열림"
                          className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 shrink-0 p-0.5"
                        >
                          <AppIcon name="external-link" size={10} strokeWidth={2} />
                        </a>
                      </div>
                    ))}

                    <div className="pt-1.5 mt-1 border-t border-zinc-200/60 dark:border-zinc-800 flex items-center justify-between text-[11px]">
                      <Link
                        href={`/blog?category=${encodeURIComponent(cat.name)}`}
                        className="font-extrabold text-[var(--google-blue)] dark:text-[#8ab4f8] hover:underline flex items-center gap-1"
                      >
                        <span>{cat.name} 전체 글 보기</span>
                        <AppIcon name="chevron-right" size={10} strokeWidth={2.5} />
                      </Link>
                      <a
                        href={cat.officialUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10.5px] text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 flex items-center gap-0.5"
                      >
                        <span>시청 직결</span>
                        <AppIcon name="external-link" size={9} strokeWidth={2} />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </PremiumCard>

      {/* ── 2. 주목할 의정부 소식 (보상스쿨 인기 칼럼 스타일 벤치마킹) ── */}
      {recentPosts.length > 0 && (
        <PremiumCard borderColor="blue" hoverEffect={false} watermarkIcon="file-text" className="!p-4 sm:!p-5">
          <div className="flex items-center justify-between min-w-0 gap-2 mb-3 pb-2 border-b border-gray-100 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <AppIcon name="file-text" size={16} strokeWidth={2.5} className="text-[var(--google-blue)]" />
              <h3 className="text-xs sm:text-sm font-extrabold text-zinc-950 dark:text-white tracking-tight">
                주목할 의정부 소식
              </h3>
            </div>
            <Link
              href="/blog"
              className="text-[10px] font-bold text-zinc-500 hover:text-[var(--google-blue)] dark:text-zinc-400 dark:hover:text-[#8ab4f8] transition-colors"
            >
              전체보기 &gt;
            </Link>
          </div>
          <ul className="divide-y divide-gray-100 dark:divide-zinc-800/70">
            {recentPosts.map((post, idx) => (
              <li key={post.slug} className="py-2.5 first:pt-0 last:pb-0">
                <Link href={`/blog/${post.slug}`} className="group block space-y-1">
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-black text-zinc-400 group-hover:text-[var(--google-blue)] dark:group-hover:text-[#8ab4f8] w-3.5 shrink-0 pt-0.5 transition-colors">
                      {idx + 1}
                    </span>
                    <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 group-hover:text-[var(--google-blue)] dark:group-hover:text-[#8ab4f8] line-clamp-2 leading-snug break-keep transition-colors flex-1">
                      {post.title}
                    </h4>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-zinc-400 pl-5.5">
                    <AppIcon name="calendar" size={10} strokeWidth={2} />
                    <span>{post.date}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </PremiumCard>
      )}

      {/* ── 3. 실시간 인기 키워드 태그 카드 ── */}
      {tags.length > 0 && (
        <PremiumCard borderColor="default" hoverEffect={false} watermarkIcon="pin" className="!p-4">
          <div className="flex items-center justify-between min-w-0 gap-2 mb-2 pb-1.5 border-b border-gray-100 dark:border-zinc-800">
            <div className="flex items-center gap-1.5">
              <AppIcon name="pin" size={14} strokeWidth={2.5} className="text-zinc-900 dark:text-zinc-100" />
              <h3 className="text-xs font-extrabold text-zinc-950 dark:text-white tracking-tight">인기 키워드 태그</h3>
            </div>
            <span className="bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 text-[9.5px] font-bold px-1.5 py-0.2 border border-zinc-200 dark:border-zinc-700">
              추천
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5 text-xs font-medium">
            {visibleTags.map((tag) => (
              <Link
                key={tag}
                href={`/blog?tag=${encodeURIComponent(tag)}`}
                className="flex items-center gap-0.5 px-2.5 py-1 rounded-none bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-gray-200/80 dark:border-zinc-800 hover:border-[var(--google-blue)] hover:text-[var(--google-blue)] hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-all font-medium"
              >
                <span className="text-zinc-400 dark:text-zinc-500">#</span>
                {tag}
              </Link>
            ))}
          </div>
          {hiddenTags.length > 0 && <SidebarTagMore tags={hiddenTags} />}
        </PremiumCard>
      )}

      {/* ── 4. 보상스쿨 연계 : 의정부 시민 무료 사고·상해 보상 진단 ── */}
      <div className="p-4 border border-blue-200 dark:border-blue-900/50 bg-gradient-to-br from-blue-900 via-indigo-950 to-zinc-950 text-white shadow-sm relative overflow-hidden group">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <AppIcon name="scale" size={14} strokeWidth={2.5} className="text-blue-300" />
            <span className="text-xs font-extrabold text-white">시민 무료 보상 진단</span>
          </div>
          <span className="text-[10px] font-bold text-blue-200 bg-blue-500/20 px-1.5 py-0.5 border border-blue-400/30">
            보상스쿨 연계
          </span>
        </div>
        <p className="text-[11px] text-zinc-300 leading-relaxed font-normal mt-1">
          교통사고, 낙상, 일상 상해 보험금 및 후유장해 1:1 전문 무료 상담
        </p>
        <a
          href="https://claim-works.com"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2.5 inline-flex items-center justify-between w-full p-2 bg-[var(--google-blue)] hover:bg-blue-600 border border-blue-400/40 text-xs font-bold text-white transition-colors"
        >
          <span>보상스쿨 1:1 상담 바로가기</span>
          <AppIcon name="chevron-right" size={12} strokeWidth={2.5} />
        </a>
      </div>

      {/* ── 5. 의정부시 공식 행정 직통 안내 배너 ── */}
      <div className="p-4 border border-gray-200/90 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <AppIcon name="phone" size={14} strokeWidth={2.5} className="text-zinc-700 dark:text-zinc-300" />
          <span className="text-xs font-extrabold text-zinc-950 dark:text-white">의정부시 대표 콜센터</span>
        </div>
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed font-normal">
          시정 문의 및 생활 민원 안내 (평일 09:00 ~ 18:00)
        </p>
        <a
          href="tel:031-828-1234"
          className="mt-2.5 inline-flex items-center justify-between w-full p-2 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-gray-200 dark:border-zinc-700 text-xs font-bold text-zinc-950 dark:text-white transition-colors"
        >
          <span>031-828-1234</span>
          <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-normal">전화연결 &gt;</span>
        </a>
      </div>
    </div>
  );
}
