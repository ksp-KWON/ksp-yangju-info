'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState, Suspense } from 'react';
import PostCard from '@/components/ui/PostCard';
import AppIcon from '@/components/ui/AppIcon';
import PageHeaderBanner from '@/components/ui/PageHeaderBanner';
import PremiumCard from '@/components/ui/PremiumCard';
import PremiumButton from '@/components/ui/PremiumButton';
import { PostData } from '@/lib/types';

/**
 * 인라인 검색 폼 컴포넌트
 * - React 19 권장 표준: key={q}를 통해 쿼리 변경 시 상태를 자연스럽게 초기화
 * - useEffect 내 setState 동기 호출 안티패턴을 원천 배제하여 cascading render 0회 보장
 */
function InlineSearchForm({
  initialQuery,
  onSearch,
}: {
  initialQuery: string;
  onSearch: (query: string) => void;
}) {
  const [val, setVal] = useState(initialQuery);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(val.trim().slice(0, 40));
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 relative flex items-center bg-white dark:bg-[#202124] border border-gray-200/90 dark:border-zinc-800 rounded-none shadow-xs p-1 focus-within:border-[var(--google-blue)] dark:focus-within:border-[#8ab4f8] transition-all"
    >
      <div className="pl-3 pr-2 text-zinc-400 dark:text-zinc-500 shrink-0">
        <AppIcon name="search" size={18} strokeWidth={2} />
      </div>
      <input
        type="text"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder="병원, 민원 키워드를 입력하세요 (예: 양주 일자리)"
        className="w-full bg-transparent text-sm sm:text-base font-bold text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none py-1.5"
      />
      {val && (
        <button
          type="button"
          onClick={() => setVal('')}
          className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors mr-1 cursor-pointer shrink-0"
          aria-label="검색어 지우기"
        >
          <AppIcon name="close" size={16} strokeWidth={2} />
        </button>
      )}
      <button
        type="submit"
        className="px-4 py-2 bg-[var(--google-blue)] text-white text-xs sm:text-sm font-extrabold rounded-none hover:bg-blue-700 transition-colors whitespace-nowrap cursor-pointer shrink-0"
      >
        검색
      </button>
    </form>
  );
}

function SearchResults() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawQ = searchParams.get('q') || '';
  const q = rawQ.trim().slice(0, 40);

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

        // W3C 표준 다중 토큰(공백 분리) AND 검색 엔진
        const tokens = q.toLowerCase().split(/\s+/).filter(Boolean);

        const filtered = allPosts.filter((post) => {
          const title = post.title.toLowerCase();
          const summary = (post.summary || '').toLowerCase();
          const tags = (post.tags || []).join(' ').toLowerCase();
          const cat = Array.isArray(post.category)
            ? post.category.join(' ').toLowerCase()
            : (post.category || '').toLowerCase();
          const subCat = (post.subCategory || '').toLowerCase();
          const combined = `${title} ${summary} ${tags} ${cat} ${subCat}`;

          return tokens.every((token) => combined.includes(token));
        });

        setResults(filtered);
      } catch (e) {
        console.error('검색 데이터 호출 실패:', e);
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

  const handleSearch = (newQuery: string) => {
    if (newQuery) {
      router.push(`/search?q=${encodeURIComponent(newQuery)}`);
    } else {
      router.push('/search');
    }
  };

  const popularKeywords = ['응급실', '병원', '건강검진', '민원', '일자리', '문화'];

  return (
    <div className="space-y-6 sm:space-y-8">
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
            '양주 생활정보 검색'
          )
        }
        description={q ? `총 ${results.length}개의 관련 소식을 찾았습니다.` : '찾으시는 병원, 민원, 일자리 키워드를 검색해 보세요.'}
        watermarkIcon="search"
      >
        {/* 인라인 검색창 (React 19 key 기반 무결점 상태 초기화) */}
        <InlineSearchForm key={q} initialQuery={q} onSearch={handleSearch} />

        {/* 추천 키워드 칩 */}
        <div className="mt-4 flex items-center flex-wrap gap-1.5 pt-3.5 border-t border-gray-100 dark:border-zinc-800">
          <span className="text-xs font-bold text-zinc-500 mr-1 flex items-center gap-1">
            <AppIcon name="zap" size={12} strokeWidth={2} className="text-amber-500" />
            추천 키워드:
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
            단어의 철자가 정확한지 확인하시거나 위의 검색창에서 다른 유사 검색어로 다시 시도해 보세요.
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
