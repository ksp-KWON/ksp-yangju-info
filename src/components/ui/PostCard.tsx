import React from 'react';
import Link from 'next/link';
import { PostData, PostMeta } from '@/lib/types';
import AppIcon, { type AppIconName } from '@/components/ui/AppIcon';
import PremiumBadge, { type BadgeColor } from '@/components/ui/PremiumBadge';
import PremiumCard, { type BorderColor } from '@/components/ui/PremiumCard';

interface PostCardProps {
  post: PostMeta | PostData;
  variant?: 'grid' | 'list';
}

interface CategoryTheme {
  borderColor: BorderColor;
  badgeColor: BadgeColor;
  titleHover: string;
  textMain: string;
}

function getCategoryTheme(category: string): CategoryTheme {
  if (category.includes('교통') || category.includes('주차')) {
    return {
      borderColor: 'blue',
      badgeColor: 'blue',
      titleHover: 'group-hover:text-[var(--google-blue)] dark:group-hover:text-[#8ab4f8]',
      textMain: 'text-[var(--google-blue)] dark:text-[#8ab4f8]',
    };
  }
  if (category.includes('청소') || category.includes('환경') || category.includes('폐기물')) {
    return {
      borderColor: 'teal',
      badgeColor: 'green',
      titleHover: 'group-hover:text-teal-600 dark:group-hover:text-teal-400',
      textMain: 'text-teal-600 dark:text-teal-400',
    };
  }
  if (category.includes('체육') || category.includes('공원') || category.includes('산책')) {
    return {
      borderColor: 'green',
      badgeColor: 'green',
      titleHover: 'group-hover:text-[var(--google-green)] dark:group-hover:text-[#81c995]',
      textMain: 'text-[var(--google-green)] dark:text-[#81c995]',
    };
  }
  if (category.includes('문화') || category.includes('예술') || category.includes('축제')) {
    return {
      borderColor: 'rose',
      badgeColor: 'rose',
      titleHover: 'group-hover:text-rose-600 dark:group-hover:text-rose-400',
      textMain: 'text-rose-600 dark:text-rose-400',
    };
  }
  if (category.includes('재난') || category.includes('민방위') || category.includes('안전') || category.includes('응급')) {
    return {
      borderColor: 'red',
      badgeColor: 'rose',
      titleHover: 'group-hover:text-[var(--google-red)] dark:group-hover:text-[#f28b82]',
      textMain: 'text-[var(--google-red)] dark:text-[#f28b82]',
    };
  }
  if (category.includes('기업') || category.includes('경제') || category.includes('농업')) {
    return {
      borderColor: 'yellow',
      badgeColor: 'amber',
      titleHover: 'group-hover:text-amber-600 dark:group-hover:text-amber-400',
      textMain: 'text-amber-600 dark:text-amber-400',
    };
  }
  if (category.includes('복지') || category.includes('돌봄')) {
    return {
      borderColor: 'indigo',
      badgeColor: 'indigo',
      titleHover: 'group-hover:text-indigo-600 dark:group-hover:text-indigo-400',
      textMain: 'text-indigo-600 dark:text-indigo-400',
    };
  }
  if (category.includes('주택') || category.includes('재개발')) {
    return {
      borderColor: 'orange',
      badgeColor: 'amber',
      titleHover: 'group-hover:text-orange-600 dark:group-hover:text-orange-400',
      textMain: 'text-orange-600 dark:text-orange-400',
    };
  }
  return {
    borderColor: 'blue',
    badgeColor: 'blue',
    titleHover: 'group-hover:text-[var(--google-blue)] dark:group-hover:text-[#8ab4f8]',
    textMain: 'text-[var(--google-blue)] dark:text-[#8ab4f8]',
  };
}

function getWatermarkIcon(category: string): AppIconName {
  if (category.includes('지원금') || category.includes('복지')) return 'bank';
  if (category.includes('건강') || category.includes('의료')) return 'hospital';
  if (category.includes('문화') || category.includes('축제')) return 'party-popper';
  if (category.includes('생활') || category.includes('교통')) return 'shield-check';
  return 'file-text';
}

export default function PostCard({ post, variant = 'grid' }: PostCardProps) {
  const categoriesToDisplay = Array.isArray(post.category) ? post.category : post.category ? [post.category] : [];
  const mainCategory = categoriesToDisplay[0] || '생활·교통';
  const watermarkIcon = getWatermarkIcon(mainCategory);
  const theme = getCategoryTheme(mainCategory);

  if (variant === 'list') {
    return (
      <Link href={'/blog/' + post.slug} className="group flex flex-col w-full">
        <PremiumCard
          borderColor={theme.borderColor}
          hoverEffect={true}
          watermarkIcon={watermarkIcon}
          className="p-4 sm:p-6 h-full justify-between"
        >
          <div className="relative z-10 space-y-2">
            {/* 상단 메타: 카테고리 뱃지 + 발행일자 */}
            <div className="flex items-center justify-between gap-2">
              <PremiumBadge color={theme.badgeColor}>
                {mainCategory}
              </PremiumBadge>
              <time className="text-xs font-medium text-zinc-400 dark:text-zinc-500 flex items-center gap-1 shrink-0">
                <AppIcon name="calendar" size={13} strokeWidth={1.5} />
                <span>{post.date}</span>
              </time>
            </div>

            {/* 제목 & 요약문 */}
            <div>
              <h2 className={`text-base sm:text-lg font-bold tracking-tight text-zinc-950 dark:text-white ${theme.titleHover} transition-colors line-clamp-2 leading-snug break-keep`}>
                {post.title}
              </h2>
              {post.summary && (
                <p className="text-xs sm:text-sm font-normal text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed break-keep mt-1.5">
                  {post.summary}
                </p>
              )}
            </div>
          </div>

          {/* 하단 영역: 태그 클라우드 + 자세히 보기 버튼 */}
          <div className="mt-4 pt-3.5 border-t border-gray-100 dark:border-zinc-800/80 flex items-center justify-between gap-3 relative z-10">
            <div className="flex flex-wrap gap-1.5">
              {(post.tags || []).slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-[11px] font-medium px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200/80 dark:border-zinc-700/80 rounded-none"
                >
                  #{tag}
                </span>
              ))}
            </div>

            <div className={`shrink-0 flex items-center gap-1 text-xs sm:text-sm font-bold ${theme.textMain}`}>
              <span>자세히 보기</span>
              <AppIcon
                name="chevron-right"
                size={14}
                strokeWidth={2.5}
                className="group-hover:translate-x-1 transition-transform"
              />
            </div>
          </div>
        </PremiumCard>
      </Link>
    );
  }

  // Grid variant
  return (
    <Link href={'/blog/' + post.slug} className="group flex flex-col h-full">
      <PremiumCard
        borderColor={theme.borderColor}
        hoverEffect={true}
        watermarkIcon={watermarkIcon}
        className="p-4 sm:p-5 h-full justify-between"
      >
        <div className="relative z-10">
          <div className="flex items-center justify-between gap-2 mb-3">
            <PremiumBadge color={theme.badgeColor}>
              {mainCategory}
            </PremiumBadge>
            <time className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
              <AppIcon name="calendar" size={13} />
              {post.date}
            </time>
          </div>
          <div className="space-y-2">
            <h3 className={`text-[14.5px] sm:text-[15.5px] font-bold text-zinc-950 dark:text-white leading-snug break-keep line-clamp-2 ${theme.titleHover} transition-colors`}>
              {post.title}
            </h3>
            <p className="text-xs sm:text-[13px] text-zinc-600 dark:text-zinc-400 leading-relaxed line-clamp-2 break-keep font-normal">
              {post.summary}
            </p>
          </div>
        </div>

        <div className={`mt-4 w-full text-xs sm:text-[12.5px] font-bold text-[#202124] dark:text-[#e8eaed] flex items-center justify-between transition-colors p-2.5 bg-gray-50/90 dark:bg-white/5 border border-gray-100 dark:border-zinc-800/80 group-hover:bg-[#e8f0fe]/60 dark:group-hover:bg-[#174ea6]/20 ${theme.titleHover} relative z-10`}>
          <div className="flex items-center gap-2">
            <span>글 읽기</span>
          </div>
          <AppIcon name="chevron-right" size={14} strokeWidth={2.5} className="group-hover:translate-x-0.5 transition-transform" />
        </div>
      </PremiumCard>
    </Link>
  );
}
