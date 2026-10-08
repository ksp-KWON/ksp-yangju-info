'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState, Suspense } from 'react';
import PostCard from '@/components/ui/PostCard';
import AppIcon from '@/components/ui/AppIcon';
import PageHeaderBanner from '@/components/ui/PageHeaderBanner';
import PremiumCard from '@/components/ui/PremiumCard';
import PremiumButton from '@/components/ui/PremiumButton';
import { PostData } from '@/lib/types';

function SearchResults() {
  const searchParams = useSearchParams();
  const q = searchParams.get('q') || '';
  const [results, setResults] = useState<PostData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let ignore = false;

    const fetchPosts = async () => {
      if (!q) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const res = await fetch('/api/posts');
        if (!res.ok) throw new Error('Failed to fetch');
        const allPosts: PostData[] = await res.json();
        if (ignore) return;

        const query = q.toLowerCase().trim();
        const filtered = allPosts.filter((post) => {
          const titleMatch = post.title.toLowerCase().includes(query);
          const summaryMatch = (post.summary || '').toLowerCase().includes(query);
          const tagsMatch = (post.tags || []).some((tag) => tag.toLowerCase().includes(query));
          const catMatch = Array.isArray(post.category)
            ? post.category.some((c) => c.toLowerCase().includes(query))
            : (post.category || '').toLowerCase().includes(query);
          return titleMatch || summaryMatch || tagsMatch || catMatch;
        });

        setResults(filtered);
      } catch (e) {
        console.error(e);
        if (!ignore) setResults([]);
      } finally {
        if (!ignore) setIsLoading(false);
      }
    };

    fetchPosts();

    return () => {
      ignore = true;
    };
  }, [q]);

  const popularKeywords = ['응급실', '병원', '건강검진', '민원'];

  return (
    <div className="space-y-8">
      {/* 1. 검색 인트로 헤더 */}
      <PageHeaderBanner
        className="mt-4"
        badgeText="통합 검색 센터"
        badgeTone="sky"
        badgeIcon="search"
        title={
          q ? (
            <span>
              ‘<span className="text-sky-700 dark:text-sky-400 underline decoration-2">{q}</span>’ 검색 결과
            </span>
          ) : (
            '의정부 생활정보 검색'
          )
        }
        description={q ? `총 ${results.length}개의 관련 소식을 찾았습니다.` : '찾으시는 병원, 민원 키워드를 입력해 보세요.'}
        watermarkIcon="search"
      >
        {/* 추천 키워드 칩 */}
        <div className="mt-5 flex items-center flex-wrap gap-1.5 pt-4 border-t border-gray-100 dark:border-zinc-800">
          <span className="text-xs font-bold text-zinc-500 mr-1 flex items-center gap-1">
            <AppIcon name="zap" size={12} strokeWidth={2} className="text-amber-500" />
            인기 키워드:
          </span>
          {popularKeywords.map((kw) => (
            <Link
              key={kw}
              href={`/search?q=${encodeURIComponent(kw)}`}
              className="px-2.5 py-1 text-xs font-medium rounded-none bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-gray-200/90 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition-all shadow-2xs"
            >
              #{kw}
            </Link>
          ))}
        </div>
      </PageHeaderBanner>

      {/* 2. 결과 목록 */}
      {isLoading ? (
        <PremiumCard hoverEffect={false} className="p-16 text-center">
          <AppIcon name="refresh" size={32} strokeWidth={2} className="animate-spin mx-auto text-sky-600 mb-3" />
          <p className="text-sm font-bold text-zinc-600 dark:text-zinc-400">데이터를 검색하고 있습니다...</p>
        </PremiumCard>
      ) : results.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((post) => (
            <PostCard key={post.slug} post={post} variant="grid" />
          ))}
        </div>
      ) : q ? (
        <PremiumCard hoverEffect={false} className="p-16 text-center">
          <AppIcon name="search" size={40} strokeWidth={1.5} className="mx-auto text-zinc-400 mb-3" />
          <h3 className="text-lg font-bold text-zinc-950 dark:text-white mb-1">검색 결과가 없습니다</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto break-keep">
            단어의 철자가 정확한지 확인하시거나 다른 유사 검색어로 다시 시도해 보세요.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <PremiumButton href="/blog" variant="primary" size="md">
              전체 소식 보기
            </PremiumButton>
          </div>
        </PremiumCard>
      ) : null}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-sm font-bold text-zinc-500">검색 엔진 로딩 중...</div>}>
      <SearchResults />
    </Suspense>
  );
}
