import React from 'react';

/**
 * HighlightBadge.tsx
 * 보상스쿨 벤치마킹 파스텔톤 배경 칼라 볼드 하이라이트 공통 컴포넌트
 * - 헌법 제3조 3.1항 [표준 · 범용 · 콤팩트 · 통합 · 공유 · 공통] 준수
 * - 본문 키워드, 인사이트, 자격 요건 등에 은은한 파스텔 배경과 또렷한 굵은 텍스트를 제공합니다.
 */

export type HighlightVariant = 'emerald' | 'sky' | 'amber' | 'rose' | 'zinc';

export interface HighlightBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: HighlightVariant;
  children: React.ReactNode;
}

export const HIGHLIGHT_CLASSES: Record<HighlightVariant, string> = {
  // 1. 에메랄드 파스텔 (지원금, 혜택, 감면, 무료, 환급 등 긍정적 시정 혜택)
  emerald:
    'bg-emerald-50 text-emerald-900 border border-emerald-200/70 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60 font-bold px-1.5 py-0.5 mx-0.5 rounded-none',

  // 2. 스카이 파스텔 (신청, 접수, 절차, 일정, 온라인, 창구 등 행동 요령)
  sky:
    'bg-sky-50 text-sky-900 border border-sky-200/70 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/60 font-bold px-1.5 py-0.5 mx-0.5 rounded-none',

  // 3. 앰버 파스텔 (주의, 필수, 구비서류, 지참, 확인 등 헛걸음 방지)
  amber:
    'bg-amber-50 text-amber-900 border border-amber-200/70 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60 font-bold px-1.5 py-0.5 mx-0.5 rounded-none',

  // 4. 로즈 파스텔 (불가, 제외, 기한만료, 중단, 주의사항, 응급)
  rose:
    'bg-rose-50 text-rose-900 border border-rose-200/70 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60 font-bold px-1.5 py-0.5 mx-0.5 rounded-none',

  // 5. 징크 파스텔 (자격 요건, 행정기관명, 일반 공통 묵향)
  zinc:
    'bg-zinc-100 text-zinc-950 border border-zinc-200/80 dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700 font-bold px-1.5 py-0.5 mx-0.5 rounded-none',
};

/**
 * 텍스트 키워드 기반 자동 파스텔 톤 분류 엔진
 */
export function getKeywordHighlightVariant(text: string): HighlightVariant {
  if (!text) return 'zinc';

  // 에메랄드: 혜택, 지원금, 감면, 무료, 환급, 장학, 할인, 쿠폰, 인센티브
  if (/(지원금|혜택|감면|무료|환급|장학|할인|수당|바우처|절감|인센티브)/.test(text)) {
    return 'emerald';
  }

  // 스카이: 신청, 접수, 방법, 절차, 일정, 기간, 온라인, 정부24, 창구, 링크
  if (/(신청|접수|절차|일정|기간|온라인|정부24|창구|방법|안내|홈페이지|링크)/.test(text)) {
    return 'sky';
  }

  // 앰버: 필수, 서류, 지참, 확인, 신분증, 주의, 체크, 기한, 마감
  if (/(필수|서류|지참|확인|신분증|체크|주의|기한|마감|금식|예약)/.test(text)) {
    return 'amber';
  }

  // 로즈: 불가, 제외, 중단, 응급, 과태료, 벌금, 주의사항, 미지급
  if (/(불가|제외|중단|응급|과태료|벌금|주의사항|미지급|종료)/.test(text)) {
    return 'rose';
  }

  return 'zinc';
}

export default function HighlightBadge({
  variant = 'zinc',
  className = '',
  children,
  ...props
}: HighlightBadgeProps) {
  const finalClass = `${HIGHLIGHT_CLASSES[variant]} ${className}`.trim();

  return (
    <strong className={finalClass} {...props}>
      {children}
    </strong>
  );
}
