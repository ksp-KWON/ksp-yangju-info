'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import TableOfContents from './TableOfContents';
import CommonBox from './CommonBox';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import ShareButtons from './ShareButtons';
import AppIcon from '@/components/ui/AppIcon';
import EmergencyBanner from '@/components/emergency/EmergencyBanner';
import LearningBanner from '@/components/learning/LearningBanner';
import { parseBlogPost } from '@/lib/blog-utils';

const SCROLL_OFFSET = 140;

interface BlogPostClientProps {
  content: string;
  title: string;
  sourceLink?: string;
  tags?: string[];
  totalCourses: number;
}

export default function BlogPostClient({ content, title, sourceLink, tags = [], totalCourses }: BlogPostClientProps) {
  const [activeId, setActiveId] = useState('');
  const { opening, keyPoints, keyPointsTitle, checklistItems, checklistTitle, faqItems, toc, sections } = parseBlogPost(content);

  // [무기 4] 자가진단 체크리스트 인터랙티브 상태
  const [checkedMap, setCheckedMap] = useState<Record<number, boolean>>({});
  // [무기 5] FAQ 아코디언 열림/닫힘 상태 (기본 첫 번째 항목 열림)
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  useEffect(() => {
    const onScroll = () => {
      const headings = document.querySelectorAll('[data-blog-body] h2[id]');
      let current = '';
      headings.forEach((h) => {
        if (h.getBoundingClientRect().top < SCROLL_OFFSET + 10) current = h.id;
      });
      setActiveId(current);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleTOCClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      window.scrollTo({
        top: element.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET,
        behavior: 'smooth',
      });
    }
  };

  const toggleCheck = (idx: number) => {
    setCheckedMap((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const toggleFaq = (idx: number) => {
    setOpenFaqIndex((prev) => (prev === idx ? null : idx));
  };

  return (
    <div className="space-y-7" data-blog-body>
      {/* ── [무기 1] 행정 핵심 요약 (3줄 브리핑) ── */}
      {keyPoints && keyPoints.length > 0 && (
        <CommonBox
          title={keyPointsTitle || '행정 핵심 요약 (3줄 브리핑)'}
          tone="red"
          icon={<AppIcon name="file-text" size={18} strokeWidth={2.5} />}
        >
          <ul className="space-y-2.5 font-normal text-zinc-800 dark:text-zinc-200 list-none ml-0 pl-0">
            {keyPoints.map((pt, i) => (
              <li key={i} className="flex items-start gap-2 pl-0">
                <span className="text-[10px] sm:text-[11px] text-red-600 dark:text-red-400 mt-1.5 shrink-0 select-none leading-none font-bold">
                  ▪
                </span>
                <span className="leading-relaxed flex-1 min-w-0">
                  <MarkdownRenderer content={pt} inline />
                </span>
              </li>
            ))}
          </ul>
        </CommonBox>
      )}

      {/* ── 오프닝 서술 문단 (보상스쿨 표준: 순수 커스텀 마크다운 렌더링) ── */}
      {opening && (
        <div className="my-7 text-zinc-800 dark:text-zinc-200 text-[15px] sm:text-[15.5px] leading-[1.85] [&>p]:mb-4 [&>p:last-child]:!mb-0">
          <MarkdownRenderer content={opening} />
        </div>
      )}

      {/* ── [무기 2] 시민 안내 목차 내비게이터 (TOC) ── */}
      {toc && toc.length > 0 && (
        <TableOfContents toc={toc} activeId={activeId} onItemClick={handleTOCClick} />
      )}

      {/* ── 본문 챕터 섹션들 (보상스쿨 표준: 외부 prose 간섭 전면 배제) ── */}
      <div className="space-y-6">
        {sections.map((section, idx) => (
          <div key={idx}>
            <MarkdownRenderer content={section} />
          </div>
        ))}
      </div>

      {/* ── [무기 4] 신청 자격 1분 자가진단 (체크리스트) ── */}
      {checklistItems && checklistItems.length > 0 && (
        <CommonBox
          title={checklistTitle || '신청 자격 1분 자가진단'}
          tone="green"
          icon={
            <AppIcon
              name={
                checklistTitle?.includes('관람') || checklistTitle?.includes('축제')
                  ? 'sparkles'
                  : checklistTitle?.includes('응급') || checklistTitle?.includes('대처')
                  ? 'shield-alert'
                  : checklistTitle?.includes('검진')
                  ? 'stethoscope'
                  : 'shield-check'
              }
              size={18}
              strokeWidth={2.5}
            />
          }
          headerRight={
            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 dark:text-emerald-200 dark:bg-emerald-950/60 px-2 py-0.5 border border-emerald-200 dark:border-emerald-800">
              {checklistTitle?.includes('관람')
                ? '관람안내'
                : checklistTitle?.includes('체크리스트')
                ? '체크리스트'
                : '자가진단'}
            </span>
          }
        >
          <div className="space-y-2.5">
            {checklistItems.map((item, idx) => {
              const isChecked = !!checkedMap[idx];
              const cleanItem = item.replace(/^\[\s*\]\s*/, '').replace(/^\[x\]\s*/i, '');
              return (
                <button
                  key={idx}
                  onClick={() => toggleCheck(idx)}
                  className={`w-full text-left flex items-start gap-3 p-3 transition-all border rounded-none cursor-pointer ${
                    isChecked
                      ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700'
                      : 'bg-white dark:bg-[#202124] border-gray-200/90 dark:border-zinc-800 hover:border-emerald-400 dark:hover:border-emerald-600'
                  }`}
                >
                  <div className={`w-5 h-5 mt-0.5 shrink-0 flex items-center justify-center border transition-colors ${isChecked ? 'bg-[var(--google-green)] border-[var(--google-green)] text-white dark:bg-emerald-500 dark:border-emerald-500' : 'border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800'}`}>
                    {isChecked && <AppIcon name="check" size={14} strokeWidth={3} />}
                  </div>
                  <span className={`text-xs sm:text-sm font-medium break-keep leading-snug ${isChecked ? 'text-zinc-900 dark:text-zinc-100 font-bold line-through opacity-70' : 'text-zinc-800 dark:text-zinc-200'}`}>
                    {cleanItem}
                  </span>
                </button>
              );
            })}
          </div>
        </CommonBox>
      )}

      {/* ── [무기 5] 자주 묻는 질문 (FAQ 아코디언) ── */}
      {faqItems && faqItems.length > 0 && (
        <CommonBox
          title="자주 묻는 질문 (FAQ)"
          tone="purple"
          icon={<AppIcon name="chat" size={18} strokeWidth={2.5} />}
        >
          <div className="space-y-3">
            {faqItems.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="border border-purple-100 dark:border-purple-950/60 hover:border-purple-300 dark:hover:border-purple-700 transition-all overflow-hidden rounded-none"
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full text-left flex items-center justify-between p-3.5 bg-purple-50/40 dark:bg-purple-950/20 font-bold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 cursor-pointer"
                  >
                    <span className="flex items-center gap-2.5 pr-2">
                      <span className="px-1.5 py-0.5 bg-purple-600 text-white dark:bg-purple-700 text-[11px] font-extrabold border border-purple-600 dark:border-purple-700">Q</span>
                      <span className="break-keep"><MarkdownRenderer content={faq.q} inline /></span>
                    </span>
                    <AppIcon
                      name={isOpen ? 'chevron-up' : 'chevron-down'}
                      size={16}
                      strokeWidth={2.5}
                      className="shrink-0 text-purple-600 dark:text-purple-400"
                    />
                  </button>
                  {isOpen && (
                    <div className="p-4 bg-white dark:bg-[#202124] border-t border-gray-100 dark:border-zinc-800 text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed font-normal">
                      <MarkdownRenderer content={faq.a} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CommonBox>
      )}

      {/* ── [무기 6] 원스톱 공식 신청처 안내 배너 (Google Material 블루 프리미엄 CTA) ── */}
      {sourceLink && (
        <div className="my-8 relative overflow-hidden rounded-none border border-blue-200 dark:border-blue-900/50 bg-gradient-to-br from-blue-900 via-indigo-950 to-zinc-950 text-white p-5 sm:p-7 shadow-md hover:shadow-lg transition-all duration-300 group">
          <div className="absolute right-3.5 bottom-1.5 opacity-10 text-white pointer-events-none group-hover:scale-105 transition-transform duration-500">
            <AppIcon name="external-link" size={90} strokeWidth={1.5} />
          </div>
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-blue-500/20 text-blue-200 text-[11px] font-bold border border-blue-400/30">
                <AppIcon name="shield-check" size={12} strokeWidth={2.5} />
                <span>의정부시 공식 접수처</span>
              </div>
              <h3 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                원스톱 공식 신청 및 상세 공고 안내
              </h3>
              <p className="text-xs sm:text-sm text-zinc-300 font-normal leading-relaxed">
                상세 접수 일정 및 추가 구비서류 공고 사항은 공식 접수처에서 바로 확인하세요.
              </p>
            </div>
            <a
              href={sourceLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-[var(--google-blue)] hover:bg-blue-600 text-white font-extrabold text-xs sm:text-sm transition-all duration-200 shrink-0 w-full sm:w-auto shadow-md hover:shadow-lg rounded-none group/btn"
            >
              <span>공식 접수처 바로가기</span>
              <AppIcon name="chevron-right" size={14} strokeWidth={3} className="group-hover/btn:translate-x-0.5 transition-transform" />
            </a>
          </div>
        </div>
      )}

      {/* ── [무기 7] 내 주변 생활 지도 퀵메뉴 (메인페이지 공유 풀 지도 배너) ── */}
      <div className="my-8 pt-6 border-t border-gray-200/80 dark:border-zinc-800">
        <div className="flex items-center gap-2 mb-3 text-xs font-bold text-zinc-600 dark:text-zinc-400">
          <AppIcon name="compass" size={15} strokeWidth={2.5} />
          <span>의정부 시민 내 주변 생활 지도 퀵메뉴</span>
        </div>
        <div className="grid grid-cols-1 gap-3">
          <EmergencyBanner />
          <LearningBanner totalCourses={totalCourses} />
        </div>
      </div>

      {/* ── 게시글 핵심 키워드 태그 클라우드 ── */}
      {tags && tags.length > 0 && (
        <div className="my-8 pt-6 border-t border-gray-100 dark:border-zinc-800">
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Link
                key={tag}
                href={`/blog?tag=${encodeURIComponent(tag)}`}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-zinc-100/90 hover:bg-zinc-900 text-zinc-700 hover:text-white dark:bg-zinc-800/90 dark:hover:bg-zinc-100 dark:text-zinc-300 dark:hover:text-zinc-950 border border-zinc-200/90 dark:border-zinc-700 transition-all rounded-none group cursor-pointer shadow-2xs"
              >
                <span className="text-zinc-400 group-hover:text-zinc-300 dark:group-hover:text-zinc-600 font-bold">#</span>
                <span>{tag}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── 원클릭 공유 & 링크 복사 바 ── */}
      <ShareButtons title={title} />
    </div>
  );
}
