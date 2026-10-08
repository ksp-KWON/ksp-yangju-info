'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import PostCard from '@/components/ui/PostCard';
import { PostData, PostMeta } from '@/lib/types';
import { CIVIC_CATEGORIES, getCategoryIcon } from '@/lib/constants';
import { getCategoryDefinition } from '@/data/uijeongbu-taxonomy';
import AppIcon from '@/components/ui/AppIcon';
import PageHeaderBanner from '@/components/ui/PageHeaderBanner';
import PremiumCard from '@/components/ui/PremiumCard';
import PremiumButton from '@/components/ui/PremiumButton';
import Link from 'next/link';

function BlogClientContent({ initialPosts }: { initialPosts: (PostMeta | PostData)[] }) {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category');
  const subCategoryParam = searchParams.get('subCategory') || searchParams.get('subcategory');
  const tagParam = searchParams.get('tag');

  let posts = initialPosts;
  let categoryTitle = '유용한 소식 및 생활 정보';
  let categoryDesc = '의정부 시민들을 위한 공공 혜택, 행사, 병원 및 생활 정보 가이드입니다.';

  const categoryCounts: Record<string, number> = {};
  for (const post of initialPosts) {
    if (post.category) {
      const cats = Array.isArray(post.category)
        ? post.category
        : typeof post.category === 'string'
        ? (post.category as string).split(',').map((s) => s.trim()).filter(Boolean)
        : [];
      for (const cat of cats) {
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      }
    }
  }
  const actualCategories = Object.keys(categoryCounts).sort((a, b) => {
    // 8대 공식 카테고리 순서 우선 정렬
    const indexA = (CIVIC_CATEGORIES as readonly string[]).indexOf(a);
    const indexB = (CIVIC_CATEGORIES as readonly string[]).indexOf(b);
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    const diff = categoryCounts[b] - categoryCounts[a];
    if (diff !== 0) return diff;
    return a.localeCompare(b, 'ko');
  });

  if (categoryParam) {
    posts = initialPosts.filter((post) => {
      if (!post.category) return false;
      const cats = Array.isArray(post.category) ? post.category : [post.category];
      const cleanParam = categoryParam.replace(/^[^\s]+\s/, '');
      return cats.some((c) => c.includes(cleanParam) || c === categoryParam);
    });
    categoryTitle = categoryParam.replace(/^[^\s]+\s/, '');
    categoryDesc = `‘${categoryTitle}’ 관련 최신 의정부 소식 및 가이드 목록입니다.`;
  }

  if (subCategoryParam) {
    posts = posts.filter((post) => {
      return post.subCategory === subCategoryParam || post.subCategory?.includes(subCategoryParam);
    });
    categoryTitle = subCategoryParam;
    categoryDesc = categoryParam
      ? `‘${categoryParam} > ${subCategoryParam}’ 관련 세부 행정 가이드 목록입니다.`
      : `‘${subCategoryParam}’ 관련 세부 행정 가이드 목록입니다.`;
  } else if (!categoryParam && tagParam) {
    posts = initialPosts.filter((post) => {
      if (!post.tags) return false;
      return post.tags.includes(tagParam);
    });
    categoryTitle = `#${tagParam} 관련 소식`;
    categoryDesc = `‘#${tagParam}’ 태그가 포함된 의정부 포스트 목록입니다.`;
  }

  // 선택된 카테고리의 하위 카테고리 목록 조회
  const activeCategoryDef = categoryParam ? getCategoryDefinition(categoryParam) : undefined;

  return (
    <div className="space-y-8 sm:space-y-10">
      {/* 1. 카테고리 헤더 */}
      <PageHeaderBanner
        className="mt-4"
        badgeText="카테고리 큐레이션"
        badgeTone="sky"
        badgeIcon="list"
        title={categoryTitle}
        description={`${categoryDesc} (총 ${posts.length}건)`}
        watermarkIcon="compass"
      />

      {/* 2. 카테고리 필터 탭바 */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <Link
            href="/blog"
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold whitespace-nowrap transition-all border rounded-none shadow-2xs ${
              !categoryParam && !tagParam && !subCategoryParam
                ? 'bg-[var(--google-blue)] text-white border-[var(--google-blue)]'
                : 'bg-white dark:bg-[#202124] text-zinc-700 dark:text-zinc-300 border-gray-200/90 dark:border-zinc-800 hover:border-[var(--google-blue)] hover:text-[var(--google-blue)]'
            }`}
          >
            <AppIcon name="list" size={14} strokeWidth={2} />
            <span>전체보기</span>
          </Link>
          {actualCategories.map((catName) => {
            const isSelected = categoryParam === catName;
            return (
              <Link
                key={catName}
                href={`/blog?category=${encodeURIComponent(catName)}`}
                className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold whitespace-nowrap transition-all border rounded-none shadow-2xs ${
                  isSelected
                    ? 'bg-[#e8f0fe] text-[var(--google-blue)] dark:bg-[#174ea6]/20 dark:text-[#8ab4f8] border-[#d2e3fc] dark:border-[#174ea6]/40'
                    : 'bg-white dark:bg-[#202124] text-zinc-700 dark:text-zinc-300 border-gray-200/90 dark:border-zinc-800 hover:border-[var(--google-blue)] hover:text-[var(--google-blue)]'
                }`}
              >
                <AppIcon name={getCategoryIcon(catName)} size={14} strokeWidth={2} className={isSelected ? 'text-[var(--google-blue)] dark:text-[#8ab4f8]' : 'text-zinc-500'} />
                <span>{catName}</span>
              </Link>
            );
          })}
        </div>

        {/* 2-1. 선택된 카테고리의 하위 카테고리 칩 바 */}
        {activeCategoryDef && activeCategoryDef.subCategories.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none border-t border-gray-100 dark:border-zinc-800/80">
            <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 shrink-0 mr-1">
              세부 분야 :
            </span>
            <Link
              href={`/blog?category=${encodeURIComponent(categoryParam!)}`}
              className={`px-2.5 py-1 text-[11px] font-bold whitespace-nowrap border rounded-none shadow-2xs transition-colors ${
                !subCategoryParam
                  ? 'bg-[var(--google-blue)] text-white border-[var(--google-blue)]'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              전체 ({categoryCounts[categoryParam!] || 0})
            </Link>
            {activeCategoryDef.subCategories.map((sub) => {
              const isSubSelected = subCategoryParam === sub.name;
              const subCount = initialPosts.filter(
                (p) => p.subCategory === sub.name && (Array.isArray(p.category) ? p.category.includes(categoryParam!) : p.category === categoryParam)
              ).length;

              return (
                <Link
                  key={sub.id}
                  href={`/blog?category=${encodeURIComponent(categoryParam!)}&subCategory=${encodeURIComponent(sub.name)}`}
                  className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold whitespace-nowrap border rounded-none shadow-2xs transition-colors ${
                    isSubSelected
                      ? 'bg-[#e8f0fe] text-[var(--google-blue)] dark:bg-[#174ea6]/30 dark:text-[#8ab4f8] border-[#d2e3fc] dark:border-[#174ea6]/40'
                      : 'bg-white dark:bg-[#202124] text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-[var(--google-blue)] hover:text-[var(--google-blue)]'
                  }`}
                >
                  <span>{sub.name}</span>
                  {subCount > 0 && (
                    <span className="text-[9.5px] px-1 py-0.2 bg-zinc-200/70 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200">
                      {subCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. 게시물 리스트 (보상스쿨 표준: 가로 1개 풀 와이드 리스트) */}
      {posts.length > 0 ? (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard key={post.slug} post={post} variant="list" />
          ))}
        </div>
      ) : (
        <PremiumCard hoverEffect={false} className="p-12 text-center">
          <AppIcon name="info" size={36} strokeWidth={1.5} className="mx-auto mb-3 text-zinc-400" />
          <p className="text-base font-bold text-zinc-800 dark:text-zinc-200">
            해당 조건에 맞는 소식이 아직 등록되지 않았습니다.
          </p>
          <div className="mt-4 flex justify-center">
            <PremiumButton href="/blog" variant="primary" size="sm" icon="chevron-right" iconPosition="right">
              전체 글 보기
            </PremiumButton>
          </div>
        </PremiumCard>
      )}
    </div>
  );
}

export default function BlogClient({ initialPosts }: { initialPosts: (PostMeta | PostData)[] }) {
  return (
    <Suspense fallback={<div className="p-12 text-center text-sm font-bold text-zinc-500">목록을 불러오는 중입니다...</div>}>
      <BlogClientContent initialPosts={initialPosts} />
    </Suspense>
  );
}
