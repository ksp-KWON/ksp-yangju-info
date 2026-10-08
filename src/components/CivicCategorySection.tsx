'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import AppIcon from '@/components/ui/AppIcon';
import PremiumHeading from '@/components/ui/PremiumHeading';
import PremiumCard from '@/components/ui/PremiumCard';
import PremiumButton from '@/components/ui/PremiumButton';
import PostCard from '@/components/ui/PostCard';
import { PostData, PostMeta } from '@/lib/types';
import { UIJEONGBU_TAXONOMY } from '@/data/uijeongbu-taxonomy';

interface CivicCategorySectionProps {
  posts: (PostMeta | PostData)[];
}

// 카테고리 우선순위 정렬 (공연 관련 '문화·예술' 1순위 보장)
const CATEGORY_ORDER = [
  '문화·예술',
  '일자리·생활',
  '복지·돌봄',
  '교통·주차',
  '기업경제·농업',
  '청소·환경',
  '주택·재개발',
  '재난·민방위',
  '체육·공원',
];

export default function CivicCategorySection({ posts }: CivicCategorySectionProps) {
  // 카테고리별 활성 하위 탭 상태 (기본값: '전체')
  const [activeTabs, setActiveTabs] = useState<Record<string, string>>({});

  // 카테고리별 & 하위 카테고리별 포스트 인덱싱
  const { categoryPostsMap, subCategoryPostsMap } = useMemo(() => {
    const catMap: Record<string, (PostMeta | PostData)[]> = {};
    const subMap: Record<string, (PostMeta | PostData)[]> = {};

    for (const post of posts) {
      if (post.category) {
        const cats = Array.isArray(post.category) ? post.category : [post.category];
        for (const cat of cats) {
          if (!catMap[cat]) catMap[cat] = [];
          catMap[cat].push(post);
        }
      }

      if (post.subCategory) {
        if (!subMap[post.subCategory]) subMap[post.subCategory] = [];
        subMap[post.subCategory].push(post);
      }
    }

    return { categoryPostsMap: catMap, subCategoryPostsMap: subMap };
  }, [posts]);

  // 포스트가 등록된 카테고리를 우선순위 순서대로 정렬하여 표시
  const activeCategories = useMemo(() => {
    return UIJEONGBU_TAXONOMY.filter((cat) => (categoryPostsMap[cat.name] || []).length > 0).sort((a, b) => {
      const idxA = CATEGORY_ORDER.indexOf(a.name);
      const idxB = CATEGORY_ORDER.indexOf(b.name);
      return (idxA !== -1 ? idxA : 99) - (idxB !== -1 ? idxB : 99);
    });
  }, [categoryPostsMap]);

  // 최신 발행 소식 상위 3건
  const latestPosts = posts.slice(0, 3);

  const handleTabChange = (categoryName: string, tabName: string) => {
    setActiveTabs((prev) => ({
      ...prev,
      [categoryName]: tabName,
    }));
  };

  // 카테고리별 테마 그라데이션 (보상스쿨 규격 매핑)
  const CATEGORY_GRADIENTS: Record<string, 'rose' | 'indigo' | 'blue' | 'yellow' | 'teal' | 'orange' | 'red' | 'green'> = {
    '문화·예술': 'rose',
    '일자리·생활': 'indigo',
    '복지·돌봄': 'indigo',
    '교통·주차': 'blue',
    '기업경제·농업': 'yellow',
    '청소·환경': 'teal',
    '주택·재개발': 'orange',
    '재난·민방위': 'red',
    '체육·공원': 'green',
  };

  // 카테고리별 제목 글씨 텍스트 컬러
  const CATEGORY_TEXT_COLORS: Record<string, string> = {
    '문화·예술': 'text-rose-600 dark:text-rose-400',
    '일자리·생활': 'text-indigo-600 dark:text-indigo-400',
    '복지·돌봄': 'text-indigo-600 dark:text-indigo-400',
    '교통·주차': 'text-[var(--google-blue)] dark:text-[#8ab4f8]',
    '기업경제·농업': 'text-amber-600 dark:text-amber-400',
    '청소·환경': 'text-teal-600 dark:text-teal-400',
    '주택·재개발': 'text-orange-600 dark:text-orange-400',
    '재난·민방위': 'text-[var(--google-red)] dark:text-[#f28b82]',
    '체육·공원': 'text-[var(--google-green)] dark:text-[#81c995]',
  };

  return (
    <div className="space-y-10 sm:space-y-12">
      {/* 🚀 [최상단] 최신 의정부 생활 브리핑 위젯 (보상스쿨 Google Blue 스타일) */}
      {latestPosts.length > 0 && (
        <PremiumCard borderColor="blue" hoverEffect={false} watermarkIcon="sparkles" className="!p-0 overflow-hidden">
          <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-50/90 via-blue-50/30 to-transparent dark:from-blue-900/30 dark:via-blue-900/10 dark:to-transparent border-b border-blue-100 dark:border-blue-900/40 flex items-center justify-between gap-3 relative z-10">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-none bg-[var(--google-blue)] text-white flex items-center justify-center shrink-0 shadow-xs">
                <AppIcon name="sparkles" size={17} strokeWidth={2.5} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[15px] sm:text-[16px] font-extrabold text-[var(--google-blue)] dark:text-[#8ab4f8] tracking-tight">
                    실시간 의정부 생활 핵심 브리핑
                  </span>
                  <span className="text-[10px] bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200 px-1.5 py-0.2 font-bold uppercase tracking-wider">
                    NEW
                  </span>
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 hidden sm:block">
                  시민 여러분께 지금 가장 유용한 신규 행정·문화·복지 소식 3선
                </p>
              </div>
            </div>
            <PremiumButton
              href="/blog"
              variant="outline"
              size="xs"
              icon="chevron-right"
              iconPosition="right"
              className="shrink-0"
            >
              전체 보기
            </PremiumButton>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-zinc-800/80 bg-white dark:bg-[#202124]">
            {latestPosts.map((post) => {
              const postCategory = Array.isArray(post.category) ? post.category[0] : post.category || '생활안내';
              const cleanCategory = postCategory.replace(/^[^\s]+\s/, '');
              return (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="p-3.5 sm:p-4.5 flex items-center justify-between gap-3 hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors group cursor-pointer"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-bold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 border border-sky-200 dark:border-sky-800">
                        {cleanCategory}
                      </span>
                      {post.subCategory && (
                        <span className="text-[11px] text-zinc-600 dark:text-zinc-400">
                          › {post.subCategory}
                        </span>
                      )}
                      <span className="text-[11px] text-zinc-600 dark:text-zinc-400 ml-auto sm:ml-0">
                        {post.date}
                      </span>
                    </div>
                    <h4 className="text-sm sm:text-[15px] font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-[var(--google-blue)] dark:group-hover:text-[#8ab4f8] transition-colors truncate">
                      {post.title}
                    </h4>
                    {post.summary && (
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 truncate mt-0.5 font-normal">
                        {post.summary}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 text-zinc-600 dark:text-zinc-400 group-hover:text-[var(--google-blue)] group-hover:translate-x-1 transition-all">
                    <AppIcon
                      name="chevron-right"
                      size={18}
                      strokeWidth={2.5}
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        </PremiumCard>
      )}

      {/* 🏛️ 카테고리별 섹션 렌더링 (각 카테고리별 2개 포스트 고정 노출) */}
      {activeCategories.map((catDef) => {
        const categoryPosts = categoryPostsMap[catDef.name] || [];
        const currentTab = activeTabs[catDef.name] || '전체';
        const categoryGradient = CATEGORY_GRADIENTS[catDef.name] || 'blue';
        const titleTextColor = CATEGORY_TEXT_COLORS[catDef.name] || 'text-zinc-900 dark:text-white';

        // 현재 선택된 탭에 따라 노출할 포스트 결정 (섹션별 2개 고정)
        const displayPosts = (
          currentTab === '전체'
            ? categoryPosts
            : subCategoryPostsMap[currentTab] || []
        ).slice(0, 2);

        // 현재 선택된 하위 카테고리 정보
        const currentSubDef =
          currentTab !== '전체'
            ? catDef.subCategories.find((s) => s.name === currentTab)
            : undefined;

        return (
          <section key={catDef.name} className="space-y-4">
            {/* 1. 카테고리별 대제목 (공통 컴포넌트 PremiumHeading with Gradient) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-gray-200/90 dark:border-zinc-800">
              <div className="min-w-0">
                <PremiumHeading
                  level={2}
                  gradient={categoryGradient}
                  icon={<AppIcon name={catDef.icon} size={22} strokeWidth={2.5} />}
                  className="!my-0 !py-1"
                >
                  <span className="flex items-center gap-2 flex-wrap">
                    <span className={titleTextColor}>{catDef.name}</span>
                    <span className="text-xs font-normal text-[#5f6368] dark:text-[#9aa0a6] hidden sm:inline-block">
                      — {catDef.tagline}
                    </span>
                  </span>
                </PremiumHeading>
              </div>

              {/* 우측 공통 버튼: 전체보기 */}
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <PremiumButton
                  href={`/blog?category=${encodeURIComponent(catDef.name)}`}
                  variant="outline"
                  size="xs"
                  icon="chevron-right"
                  iconPosition="right"
                >
                  {catDef.name} 전체 ({categoryPosts.length}건)
                </PremiumButton>
              </div>
            </div>

            {/* 2. 대제목 밑 하위 카테고리 탭버튼 (보상스쿨 Google 탭 스타일) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {/* 전체 탭 */}
              <button
                type="button"
                onClick={() => handleTabChange(catDef.name, '전체')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-none border transition-all cursor-pointer whitespace-nowrap shadow-2xs ${
                  currentTab === '전체'
                    ? 'bg-[var(--google-blue)] text-white border-[var(--google-blue)] font-extrabold shadow-xs'
                    : 'bg-white dark:bg-[#202124] text-zinc-700 dark:text-zinc-300 border-gray-200/90 dark:border-zinc-800 hover:border-[var(--google-blue)] hover:text-[var(--google-blue)] font-bold'
                }`}
              >
                <span>전체보기</span>
                <span
                  className={`text-[10px] px-1 py-0.2 rounded-none font-bold ${
                    currentTab === '전체'
                      ? 'bg-white/20 text-white'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  {categoryPosts.length}
                </span>
              </button>

              {/* 하위 카테고리 탭 버튼들 */}
              {catDef.subCategories.map((sub) => {
                const subPosts = subCategoryPostsMap[sub.name] || [];
                const subCount = subPosts.length;
                const isSelected = currentTab === sub.name;

                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => handleTabChange(catDef.name, sub.name)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-none border transition-all cursor-pointer whitespace-nowrap shadow-2xs ${
                      isSelected
                        ? 'bg-[var(--google-blue)] text-white border-[var(--google-blue)] font-extrabold shadow-xs'
                        : 'bg-white dark:bg-[#202124] text-zinc-700 dark:text-zinc-300 border-gray-200/90 dark:border-zinc-800 hover:border-[var(--google-blue)] hover:text-[var(--google-blue)] font-bold'
                    }`}
                  >
                    <span>{sub.shortName}</span>
                    {subCount > 0 ? (
                      <span
                        className={`text-[10px] px-1 py-0.2 rounded-none font-bold ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                        }`}
                      >
                        {subCount}
                      </span>
                    ) : (
                      <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-normal">
                        시청직결
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* 3. 그 아래 포스팅 박스 배치 (공통 컴포넌트 PostCard / PremiumCard) */}
            {displayPosts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
                {displayPosts.map((post) => (
                  <PostCard key={post.slug} post={post} variant="grid" />
                ))}
              </div>
            ) : (
              /* 포스트가 아직 없는 하위 카테고리 선택 시 시청 공식 안내 배너 */
              <PremiumCard hoverEffect={false} watermarkIcon="compass" className="!p-5 sm:!p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="p-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 shrink-0">
                      <AppIcon name="info" size={18} strokeWidth={2.2} />
                    </div>
                    <div>
                      <h4 className="text-sm sm:text-base font-extrabold text-zinc-950 dark:text-white">
                        ‘{currentTab}’ 관련 행정 정보
                      </h4>
                      <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-0.5 leading-relaxed">
                        {currentSubDef?.description ||
                          '의정부시청 공식 누리집을 통해 실시간 행정 소식과 신청 절차를 확인하실 수 있습니다.'}
                      </p>
                    </div>
                  </div>

                  {currentSubDef?.officialUrl && (
                    <div className="shrink-0 self-end sm:self-center">
                      <PremiumButton
                        href={currentSubDef.officialUrl}
                        isExternal={true}
                        variant="primary"
                        size="sm"
                        icon="external-link"
                        iconPosition="right"
                      >
                        시청 공식 누리집 바로가기
                      </PremiumButton>
                    </div>
                  )}
                </div>
              </PremiumCard>
            )}
          </section>
        );
      })}
    </div>
  );
}
