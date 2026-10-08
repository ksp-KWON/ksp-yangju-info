'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSlug from 'rehype-slug';
import type { Components } from 'react-markdown';
import PremiumHeading from '@/components/ui/PremiumHeading';
import PremiumCard from '@/components/ui/PremiumCard';
import CommonBox from '@/components/blog/CommonBox';
import AppIcon, { type AppIconName } from '@/components/ui/AppIcon';
import HighlightBadge, { getKeywordHighlightVariant } from '@/components/ui/HighlightBadge';

const SCROLL_OFFSET = 140;

const extractTextFromNode = (n: React.ReactNode): string => {
  if (typeof n === 'string') return n;
  if (typeof n === 'number') return String(n);
  if (Array.isArray(n)) return n.map(extractTextFromNode).join('');
  if (React.isValidElement<{ children?: React.ReactNode }>(n) && n.props?.children) {
    return extractTextFromNode(n.props.children);
  }
  return '';
};

/**
 * 챕터 제목 텍스트 및 위계(level) 기반 테마 컬러(tone) 및 W3C 라인 아이콘 매핑
 * - 7대 정통 시빅 가이드 아키텍처에 따라 일관된 색상 식별력을 부여합니다.
 */
function getHeadingToneAndIcon(level: number, text: string): { tone: 'rose' | 'blue' | 'indigo' | 'teal' | 'yellow' | 'purple' | 'green' | 'charcoal'; iconName?: AppIconName } {
  const clean = text.toLowerCase().trim();

  // 1. 핵심 요약 / 3줄 브리핑 / 주요 골자 ➔ Rose
  if (/요약|3줄|핵심\s*브리핑|주요\s*골자/.test(clean)) {
    return { tone: 'rose', iconName: 'file-text' };
  }

  // 2. 지원 대상 / 신청 자격 / 참여 대상 ➔ Blue
  if (/자격|대상|조건|기준|누가|누구/.test(clean)) {
    return { tone: 'blue', iconName: 'shield-check' };
  }

  // 3. 지원 혜택 / 감면 기준 / 지원 금액 / 주요 내용 ➔ Indigo
  if (/혜택|감면|지원|금액|보조|보상|내용|서비스/.test(clean)) {
    return { tone: 'indigo', iconName: 'award' };
  }

  // 4. 신청 방법 / 구비 서류 / 신청 절차 / 접수 ➔ Teal
  if (/신청|방법|절차|서류|접수|제출|방법과\s*일정/.test(clean)) {
    return { tone: 'teal', iconName: 'edit' };
  }

  // 5. 생활 꿀팁 / 로컬 노하우 / 행정 인사이트 / 주의사항 ➔ Yellow (Amber)
  if (/꿀팁|노하우|인사이트|주의|참고|유의|포인트|팁/.test(clean)) {
    return { tone: 'yellow', iconName: 'compass' };
  }

  // 6. 자주 묻는 질문 / 시민 FAQ / Q&A ➔ Purple
  if (/질문|faq|q&a|궁금|묻고\s*답하기/.test(clean)) {
    return { tone: 'purple', iconName: 'chat' };
  }

  // 7. 문의처 / 오시는 길 / 위치 / 지도 / 담당 부서 ➔ Green
  if (/문의|담당|연락|오시는\s*길|위치|지도|마무리|안내/.test(clean)) {
    return { tone: 'green', iconName: 'pin' };
  }

  // 기본 레벨별 톤 (위계별 표준)
  if (level === 2) return { tone: 'blue', iconName: 'book' };
  if (level === 3) return { tone: 'teal', iconName: 'chevron-right' };
  if (level === 4) return { tone: 'yellow' };
  return { tone: 'charcoal' };
}

const UnifiedHeadingRenderer = ({ level, children, id }: { level: 1|2|3|4|5|6, children?: React.ReactNode, id?: string }) => {
  const text = extractTextFromNode(children);
  const { tone, iconName } = getHeadingToneAndIcon(level, text);

  // 보상스쿨 표준 챕터/제목 호흡 및 시각적 개방감 규격 동기화
  const headingSpacing: Record<number, string> = {
    2: '!mt-14 !mb-6 !py-3',
    3: '!mt-10 !mb-5 !py-2.5',
    4: '!mt-8 !mb-4 !py-2',
    5: '!mt-6 !mb-3 !py-1.5',
    6: '!mt-6 !mb-3 !py-2',
  };

  return (
    <PremiumHeading 
      level={level} 
      id={id} 
      gradient={tone}
      strip={level === 2}
      icon={iconName ? <AppIcon name={iconName} size={level === 2 ? 18 : 15} strokeWidth={2.5} /> : undefined}
      style={{ scrollMarginTop: `${SCROLL_OFFSET}px` }}
      className={headingSpacing[level] || '!my-4'}
    >
      {children}
    </PremiumHeading>
  );
};

export const sharedComponents: Components & Record<string, React.ComponentType<{ children?: React.ReactNode; [key: string]: unknown }>> = {
  h1: ({ children, id }) => (
    <PremiumHeading level={1} id={id} style={{ scrollMarginTop: `${SCROLL_OFFSET}px` }} className="!mt-16 !mb-8 !pb-4">
      {children}
    </PremiumHeading>
  ),
  h2: (props) => <UnifiedHeadingRenderer level={2} {...props} />,
  h3: (props) => <UnifiedHeadingRenderer level={3} {...props} />,
  h4: (props) => <UnifiedHeadingRenderer level={4} {...props} />,
  h5: (props) => <UnifiedHeadingRenderer level={5} {...props} />,
  h6: (props) => <UnifiedHeadingRenderer level={6} {...props} />,

  p: ({ children }) => (
    <p className="mb-4 leading-[1.85] text-zinc-800 dark:text-zinc-200 break-keep font-normal text-[15px] sm:text-[15.5px]">
      {children}
    </p>
  ),

  ul: ({ children }) => (
    <ul className="list-none ml-0 pl-0 my-5 space-y-2.5 text-[15px] sm:text-[15.5px] text-zinc-800 dark:text-zinc-200">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal ml-5 sm:ml-6 my-5 space-y-2.5 text-[15px] sm:text-[15.5px] text-zinc-800 dark:text-zinc-200 marker:font-bold marker:text-zinc-600 dark:marker:text-zinc-400">
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li className="flex items-start gap-2 pl-0 leading-[1.8] break-keep font-normal text-zinc-800 dark:text-zinc-200">
      <span className="text-[10px] sm:text-[11px] text-zinc-500 dark:text-zinc-400 mt-1.5 shrink-0 select-none leading-none font-bold">
        ▪
      </span>
      <span className="flex-1 min-w-0">{children}</span>
    </li>
  ),

  strong: ({ children }) => {
    const text = extractTextFromNode(children);
    const variant = getKeywordHighlightVariant(text);
    return <HighlightBadge variant={variant}>{children}</HighlightBadge>;
  },

  blockquote: ({ children }: { children?: React.ReactNode }) => {
    const childArray = React.Children.toArray(children);

    const firstChild = childArray[0];

    const isFirstChildHeading =
      React.isValidElement(firstChild) &&
      typeof firstChild.type === 'string' &&
      /^h[1-6]$/i.test(firstChild.type);

    if (isFirstChildHeading) {
      const headingElement = firstChild as React.ReactElement<{ children?: React.ReactNode }>;
      const headingText = extractTextFromNode(headingElement.props.children);
      const bodyElements = childArray.slice(1);

      // 인용문 박스 톤 및 아이콘 판별
      let boxTone = 'yellow';
      if (/요약|브리핑|주의|경고/.test(headingText)) boxTone = 'red';
      else if (/자격|진단|체크|검진/.test(headingText)) boxTone = 'green';
      else if (/질문|faq/.test(headingText)) boxTone = 'purple';
      else if (/혜택|지원/.test(headingText)) boxTone = 'indigo';
      else if (/신청|절차|서류/.test(headingText)) boxTone = 'teal';
      else if (/꿀팁|노하우|인사이트/.test(headingText)) boxTone = 'yellow';

      const iconMap: Record<string, React.ReactNode> = {
        yellow: <AppIcon name="compass" size={18} strokeWidth={2.5} />,
        red: <AppIcon name="shield-alert" size={18} strokeWidth={2.5} />,
        green: <AppIcon name="shield-check" size={18} strokeWidth={2.5} />,
        purple: <AppIcon name="chat" size={18} strokeWidth={2.5} />,
        indigo: <AppIcon name="award" size={18} strokeWidth={2.5} />,
        teal: <AppIcon name="edit" size={18} strokeWidth={2.5} />,
      };

      return (
        <CommonBox
          title={headingText}
          tone={boxTone}
          icon={iconMap[boxTone]}
          className="my-8"
        >
          {bodyElements}
        </CommonBox>
      );
    }

    return (
      <blockquote className="my-8 border-l-4 border-[var(--google-blue)] pl-4 py-2 bg-blue-50/40 dark:bg-blue-950/20 text-zinc-800 dark:text-zinc-200 text-sm sm:text-base leading-relaxed not-italic">
        {children}
      </blockquote>
    );
  },

  table: ({ children }: { children?: React.ReactNode }) => (
    <div className="not-prose my-8 border border-gray-200/90 dark:border-zinc-800 bg-white dark:bg-[#202124] shadow-[0_2px_8px_rgba(0,0,0,0.03)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.2)] overflow-hidden">
      {/* 📱 모바일 전용 좌우 스크롤 안내 가이드 바 (보상스쿨 UX 표준) */}
      <div className="flex sm:hidden items-center justify-between px-3 py-1.5 bg-blue-50/70 dark:bg-blue-950/30 border-b border-blue-100 dark:border-blue-900/40 text-[11px] font-bold text-[var(--google-blue)] dark:text-[#8ab4f8] select-none">
        <div className="flex items-center gap-1.5">
          <AppIcon name="chevron-left" size={12} strokeWidth={2.5} />
          <span>표를 좌우로 밀어서 전체 내용을 확인하세요</span>
        </div>
        <AppIcon name="chevron-right" size={12} strokeWidth={2.5} />
      </div>

      {/* 좌우 터치 스크롤 컨테이너 */}
      <div className="overflow-x-auto touch-pan-x scrollbar-thin">
        <table className="w-full text-[13.5px] sm:text-[14px] border-collapse min-w-[580px] m-0">{children}</table>
      </div>
    </div>
  ),
  thead: ({ children }: { children?: React.ReactNode }) => (
    <thead className="bg-gray-50 dark:bg-[#303134] border-b border-gray-200/90 dark:border-zinc-700">{children}</thead>
  ),
  tbody: ({ children }: { children?: React.ReactNode }) => (
    <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/80">{children}</tbody>
  ),
  th: ({ children, style, ...props }: React.ComponentPropsWithoutRef<'th'>) => (
    <th
      style={style}
      className="p-3 sm:p-3.5 font-bold text-zinc-900 dark:text-zinc-100 tracking-tight whitespace-nowrap text-center bg-gray-50/90 dark:bg-[#303134]"
      {...props}
    >
      {children}
    </th>
  ),
  td: ({ children, style, ...props }: React.ComponentPropsWithoutRef<'td'>) => (
    <td
      style={style}
      className="p-3 sm:p-3.5 align-middle text-zinc-700 dark:text-zinc-300 leading-relaxed text-left font-normal break-keep"
      {...props}
    >
      {children}
    </td>
  ),
  tr: ({ children }: { children?: React.ReactNode }) => (
    <tr className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/30 transition-colors">{children}</tr>
  ),

  a: ({ href = '', children }) => (
    <a
      href={href}
      className="text-sky-700 dark:text-sky-300 font-bold underline underline-offset-4 decoration-sky-300 dark:decoration-sky-700 hover:text-sky-900 dark:hover:text-sky-200 transition-colors mx-0.5 inline group"
      target={href.startsWith('http') ? '_blank' : undefined}
      rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
    >
      <span className="leading-snug">{children}</span>
      <AppIcon name="external-link" size={13} strokeWidth={2} className="inline-block align-baseline ml-1" />
    </a>
  ),

  hr: () => (
    <div className="my-14 flex justify-center">
      <div className="w-full h-px bg-gray-200 dark:bg-zinc-800" />
    </div>
  ),

  pre: ({ children }) => (
    <pre className="whitespace-pre-wrap break-words bg-zinc-50 dark:bg-zinc-900 p-4 sm:p-5 rounded-none border border-gray-200/90 dark:border-zinc-800 my-6 text-zinc-800 dark:text-zinc-200 font-sans text-[14px] leading-relaxed overflow-x-hidden">
      {children}
    </pre>
  ),

  code: ({ children, className }: React.ComponentPropsWithoutRef<'code'>) => {
    const isInline = !className;
    if (isInline) {
      return (
        <code className="px-1.5 py-0.5 mx-0.5 rounded-none bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-[0.9em] font-sans font-bold border border-zinc-200 dark:border-zinc-700">
          {children}
        </code>
      );
    }
    return <code className="font-sans break-keep">{children}</code>;
  },

  calculator: () => null,
  red: ({ children }: { children?: React.ReactNode }) => <strong className="text-[#d93025] dark:text-[#f28b82] bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 mx-0.5 rounded-none font-bold">{children}</strong>,
  orange: ({ children }: { children?: React.ReactNode }) => <strong className="text-[#e37400] dark:text-[#fde293] bg-orange-50 dark:bg-orange-900/20 px-1.5 py-0.5 mx-0.5 rounded-none font-bold">{children}</strong>,
  green: ({ children }: { children?: React.ReactNode }) => <strong className="text-[#137333] dark:text-[#81c995] bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 mx-0.5 rounded-none font-bold">{children}</strong>,
  blue: ({ children }: { children?: React.ReactNode }) => <strong className="text-[#1A73E8] dark:text-[#8ab4f8] bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 mx-0.5 rounded-none font-bold">{children}</strong>,
  purple: ({ children }: { children?: React.ReactNode }) => <strong className="text-[#9333ea] dark:text-[#c084fc] bg-purple-50 dark:bg-purple-900/20 px-1.5 py-0.5 mx-0.5 rounded-none font-bold">{children}</strong>,

  relatedbox: ({ children }: { children?: React.ReactNode }) => (
    <PremiumCard borderColor="charcoal" hoverEffect={true} className="my-10 group">
      <div className="relative z-10">
        <div className="border-b border-gray-200/80 dark:border-zinc-800 pb-3 mb-4">
          <PremiumHeading level={3} showLeftBorder className="!mb-0 !text-zinc-900 dark:!text-zinc-100 font-bold !bg-transparent !p-0 !border-0 !shadow-none">
            함께 읽으면 유익한 글
          </PremiumHeading>
        </div>
        <ul className="space-y-3">
          {children}
        </ul>
      </div>
    </PremiumCard>
  ),

  calloutlink: ({ ...props }: { href?: string; text?: string; [key: string]: unknown }) => {
    const href = typeof props.href === 'string' ? props.href : '';
    const text = typeof props.text === 'string' ? props.text : '';
    return (
      <li className="flex items-start gap-2.5 group">
        <span className="text-zinc-900 dark:text-zinc-100 mt-0.5 font-bold shrink-0">
          <AppIcon name="link" size={14} strokeWidth={2} />
        </span>
        <a
          href={href}
          className="flex-1 text-[14.5px] font-bold text-zinc-800 dark:text-zinc-200 group-hover:underline underline-offset-4 leading-[1.7] break-keep transition-colors"
        >
          <span>{text}</span>
        </a>
      </li>
    );
  },
};

/**
 * 한국어 마크다운 볼드(**) 미변환 버그 영구 방어 전처리기
 * - 마침표, 조사, 따옴표가 공백 없이 붙어 있는 경우 CommonMark/GFM 파서가 볼드를 인식하지 못하는 버그를 완벽히 해결합니다.
 * - 코드 블록(```...```) 및 인라인 코드(`...`)는 원형 그대로 완벽 보존합니다.
 */
export function preprocessMarkdownBold(content: string): string {
  if (!content) return '';

  const codeBlocks: string[] = [];
  // 1. 코드 블록 및 인라인 코드 임시 격리
  let protectedContent = content.replace(/(```[\s\S]*?```|`[^`\n]+?`)/g, (match) => {
    codeBlocks.push(match);
    return `__CODE_BLOCK_${codeBlocks.length - 1}__`;
  });

  // 2. **텍스트**를 <strong>텍스트</strong>로 직접 안전 변환 (rehypeRaw와 연동)
  protectedContent = protectedContent.replace(/\*\*([^*\n\r]+?)\*\*/g, '<strong>$1</strong>');

  // 3. 코드 블록 복원
  return protectedContent.replace(/__CODE_BLOCK_(\d+)__/g, (_, idx) => codeBlocks[Number(idx)] || '');
}

interface MarkdownRendererProps {
  content: string;
  inline?: boolean;
}

export default function MarkdownRenderer({ content, inline = false }: MarkdownRendererProps) {
  const processedContent = preprocessMarkdownBold(content);

  if (inline) {
    return (
      <ReactMarkdown
        remarkPlugins={[[remarkGfm, { singleTilde: false }]]}
        rehypePlugins={[rehypeRaw, rehypeSlug]}
        components={{
          p: ({ children }) => <>{children}</>,
          strong: sharedComponents.strong,
          a: sharedComponents.a,
          code: sharedComponents.code,
        }}
      >
        {processedContent}
      </ReactMarkdown>
    );
  }

  return (
    <ReactMarkdown
      remarkPlugins={[[remarkGfm, { singleTilde: false }]]}
      rehypePlugins={[rehypeRaw, rehypeSlug]}
      components={sharedComponents}
    >
      {processedContent}
    </ReactMarkdown>
  );
}
