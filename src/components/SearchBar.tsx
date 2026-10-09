'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import AppIcon from '@/components/ui/AppIcon';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  // W3C 접근성 표준: ESC 키 입력 시 모달 닫기
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setIsOpen(false);
      setQuery('');
    }
  };

  const popularKeywords = ['응급실', '국가건강검진', '민원'];

  return (
    <>
      {/* 1. 헤더 검색 트리거 버튼 */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100/90 hover:bg-zinc-200/80 dark:bg-zinc-800 dark:hover:bg-zinc-700/80 border border-gray-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500 rounded-none transition-all cursor-pointer shadow-2xs"
        aria-label="통합 검색 열기"
      >
        <AppIcon name="search" size={14} strokeWidth={2} className="text-zinc-500 dark:text-zinc-400" />
        <span className="hidden sm:inline">통합 검색...</span>
      </button>

      {/* 2. 모달 팝업 (W3C 표준 대화상자) */}
      {isOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-[200] flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            role="dialog"
            aria-modal="true"
            aria-label="통합 검색 대화상자"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-xl bg-white dark:bg-[#202124] border border-gray-200/90 dark:border-zinc-800 shadow-2xl rounded-none overflow-hidden"
            >
              <form onSubmit={handleSearch} className="flex items-center p-4 border-b border-gray-100 dark:border-zinc-800">
                <AppIcon name="search" size={20} strokeWidth={2} className="text-zinc-600 dark:text-zinc-400 mr-3 shrink-0" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="병원, 민원 키워드를 입력하세요"
                  autoFocus
                  className="w-full bg-transparent text-zinc-900 dark:text-white placeholder-zinc-400 font-bold text-base focus:outline-none"
                />
                {/* 검색어 즉시 삭제 (Clear) 버튼 */}
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    className="p-1 mr-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                    aria-label="검색어 지우기"
                  >
                    <AppIcon name="close" size={16} strokeWidth={2} />
                  </button>
                )}
                {/* 모바일 가상키보드 엔터 제출용 히든 버튼 */}
                <button type="submit" className="hidden">검색</button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-none text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
                  aria-label="닫기"
                >
                  <AppIcon name="close" size={20} strokeWidth={2} />
                </button>
              </form>

              {/* 인기 검색어 안내 */}
              <div className="p-4 bg-zinc-50/70 dark:bg-zinc-900/60">
                <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-600 dark:text-zinc-400 mb-2.5">
                  <AppIcon name="trending-up" size={14} strokeWidth={2} />
                  <span>추천 검색어</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {popularKeywords.map((kw) => (
                    <button
                      key={kw}
                      type="button"
                      onClick={() => {
                        router.push(`/search?q=${encodeURIComponent(kw)}`);
                        setIsOpen(false);
                        setQuery('');
                      }}
                      className="px-2.5 py-1 text-xs font-medium bg-white dark:bg-[#202124] text-zinc-800 dark:text-zinc-200 border border-gray-200/90 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 rounded-none transition-all cursor-pointer shadow-2xs"
                    >
                      #{kw}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
