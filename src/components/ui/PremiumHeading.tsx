import React from 'react';

export type GradientColor = 'blue' | 'cyan' | 'red' | 'rose' | 'green' | 'teal' | 'orange' | 'purple' | 'indigo' | 'yellow' | 'gray' | 'charcoal' | 'ink' | 'default';

interface PremiumHeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  gradient?: GradientColor;
  icon?: React.ReactNode;
  showLeftBorder?: boolean;
  strip?: boolean;
  colorMode?: 'solid' | 'gradient';
}

export default function PremiumHeading({
  children,
  className = '',
  level = 2,
  gradient = 'default',
  icon,
  showLeftBorder = true,
  strip = false,
  colorMode = 'solid',
  ...props
}: PremiumHeadingProps) {
  const Tag = `h${level}` as React.ElementType;

  let baseClass = 'tracking-tight flex items-center flex-wrap gap-2 mb-3.5 transition-colors';

  if (level === 1) baseClass += ' text-xl sm:text-2xl font-extrabold';
  else if (level === 2) baseClass += ' text-lg sm:text-xl font-extrabold';
  else if (level === 3) baseClass += ' text-base sm:text-lg font-bold';
  else if (level === 4) baseClass += ' text-sm sm:text-base font-bold';
  else if (level === 5) baseClass += ' text-xs sm:text-sm font-semibold';
  else if (level === 6) baseClass += ' text-[14px] sm:text-[15px] font-semibold';
  else baseClass += ' text-sm sm:text-base font-bold';

  // 1. 좌측 보더 스타일
  if (showLeftBorder) {
    if (gradient === 'charcoal' || gradient === 'ink') {
      const inkBorderClasses: Record<number, string> = {
        1: 'border-l-4 border-zinc-900 dark:border-zinc-100 pl-2.5 sm:pl-3',
        2: 'border-l-4 border-zinc-900 dark:border-zinc-100 pl-2.5 sm:pl-3',
        3: 'border-l-[2.5px] border-zinc-600 dark:border-zinc-400 pl-2 sm:pl-2.5',
        4: 'border-l-2 border-zinc-400 dark:border-zinc-500 pl-2',
        5: 'border-l border-zinc-300 dark:border-zinc-600 pl-1.5',
        6: 'border-l border-zinc-300 dark:border-zinc-600 pl-1.5',
      };
      baseClass += ` ${inkBorderClasses[level] || inkBorderClasses[2]}`;
    } else {
      const borderClasses: Record<string, string> = {
        default: 'border-l-4 border-[var(--google-blue)] pl-2.5 sm:pl-3',
        blue: 'border-l-4 border-[var(--google-blue)] pl-2.5 sm:pl-3',
        cyan: 'border-l-4 border-sky-500 pl-2.5 sm:pl-3',
        red: 'border-l-4 border-[var(--google-red)] pl-2.5 sm:pl-3',
        rose: 'border-l-4 border-rose-500 pl-2.5 sm:pl-3',
        green: 'border-l-4 border-[var(--google-green)] pl-2.5 sm:pl-3',
        teal: 'border-l-4 border-teal-500 pl-2.5 sm:pl-3',
        orange: 'border-l-4 border-orange-500 pl-2.5 sm:pl-3',
        purple: 'border-l-4 border-purple-500 pl-2.5 sm:pl-3',
        indigo: 'border-l-4 border-indigo-500 pl-2.5 sm:pl-3',
        yellow: 'border-l-4 border-amber-500 pl-2.5 sm:pl-3',
        gray: 'border-l-4 border-gray-400 pl-2.5 sm:pl-3',
      };
      baseClass += ` ${borderClasses[gradient] || borderClasses.default}`;
    }
  }

  // 2. 배경 스트립 (strip) 옵션
  if (strip) {
    const stripClasses: Record<string, string> = {
      default: 'bg-gradient-to-r from-blue-50/80 via-blue-50/30 to-transparent dark:from-blue-950/30 dark:via-blue-950/10 dark:to-transparent py-2 px-3 border-b border-blue-100/70 dark:border-blue-900/30',
      blue: 'bg-gradient-to-r from-blue-50/80 via-blue-50/30 to-transparent dark:from-blue-950/30 dark:via-blue-950/10 dark:to-transparent py-2 px-3 border-b border-blue-100/70 dark:border-blue-900/30',
      cyan: 'bg-gradient-to-r from-sky-50/80 via-sky-50/30 to-transparent dark:from-sky-950/30 dark:via-sky-950/10 dark:to-transparent py-2 px-3 border-b border-sky-100/70 dark:border-sky-900/30',
      red: 'bg-gradient-to-r from-red-50/80 via-red-50/30 to-transparent dark:from-red-950/30 dark:via-red-950/10 dark:to-transparent py-2 px-3 border-b border-red-100/70 dark:border-red-900/30',
      rose: 'bg-gradient-to-r from-rose-50/80 via-rose-50/30 to-transparent dark:from-rose-950/30 dark:via-rose-950/10 dark:to-transparent py-2 px-3 border-b border-rose-100/70 dark:border-rose-900/30',
      green: 'bg-gradient-to-r from-green-50/80 via-green-50/30 to-transparent dark:from-green-950/30 dark:via-green-950/10 dark:to-transparent py-2 px-3 border-b border-green-100/70 dark:border-green-900/30',
      teal: 'bg-gradient-to-r from-teal-50/80 via-teal-50/30 to-transparent dark:from-teal-950/30 dark:via-teal-950/10 dark:to-transparent py-2 px-3 border-b border-teal-100/70 dark:border-teal-900/30',
      orange: 'bg-gradient-to-r from-orange-50/80 via-orange-50/30 to-transparent dark:from-orange-950/30 dark:via-orange-950/10 dark:to-transparent py-2 px-3 border-b border-orange-100/70 dark:border-orange-900/30',
      purple: 'bg-gradient-to-r from-purple-50/80 via-purple-50/30 to-transparent dark:from-purple-950/30 dark:via-purple-950/10 dark:to-transparent py-2 px-3 border-b border-purple-100/70 dark:border-purple-900/30',
      indigo: 'bg-gradient-to-r from-indigo-50/80 via-indigo-50/30 to-transparent dark:from-indigo-950/30 dark:via-indigo-950/10 dark:to-transparent py-2 px-3 border-b border-indigo-100/70 dark:border-indigo-900/30',
      yellow: 'bg-gradient-to-r from-amber-50/80 via-amber-50/30 to-transparent dark:from-amber-950/30 dark:via-amber-950/10 dark:to-transparent py-2 px-3 border-b border-amber-200/70 dark:border-amber-900/30',
      gray: 'bg-gradient-to-r from-gray-50/80 to-transparent dark:from-gray-900/30 to-transparent py-2 px-3 border-b border-gray-200/70 dark:border-gray-800/30',
      charcoal: 'bg-gradient-to-r from-zinc-100/80 to-transparent dark:from-zinc-900/30 to-transparent py-2 px-3 border-b border-zinc-200/70 dark:border-zinc-800/30',
      ink: 'bg-gradient-to-r from-zinc-100/80 to-transparent dark:from-zinc-900/30 to-transparent py-2 px-3 border-b border-zinc-200/70 dark:border-zinc-800/30',
    };
    baseClass += ` ${stripClasses[gradient] || stripClasses.default}`;
  }

  // 3. 선명한 텍스트 컬러 매핑 (solid 모드 기본: 가독성과 색감 극대화)
  const solidTextClasses: Record<string, string> = {
    default: 'text-zinc-900 dark:text-zinc-100',
    blue: 'text-[var(--google-blue)] dark:text-[#8ab4f8]',
    cyan: 'text-sky-700 dark:text-sky-300',
    red: 'text-[var(--google-red)] dark:text-[#f28b82]',
    rose: 'text-rose-600 dark:text-rose-400',
    green: 'text-[var(--google-green)] dark:text-[#81c995]',
    teal: 'text-teal-700 dark:text-teal-300',
    orange: 'text-orange-700 dark:text-orange-400',
    purple: 'text-purple-700 dark:text-purple-300',
    indigo: 'text-indigo-700 dark:text-indigo-300',
    yellow: 'text-amber-800 dark:text-amber-300',
    gray: 'text-gray-800 dark:text-gray-200',
    charcoal: 'text-zinc-900 dark:text-white',
    ink: 'text-zinc-900 dark:text-white',
  };

  const gradientClasses: Record<string, string> = {
    blue: 'bg-gradient-to-r from-[#0d47a1] to-[#669df6] dark:from-[#669df6] dark:to-[#aecbfa] bg-clip-text text-transparent',
    cyan: 'bg-gradient-to-r from-sky-700 to-sky-400 dark:from-sky-400 dark:to-sky-200 bg-clip-text text-transparent',
    red: 'bg-gradient-to-r from-red-700 to-red-400 dark:from-red-400 dark:to-red-200 bg-clip-text text-transparent',
    rose: 'bg-gradient-to-r from-rose-700 to-rose-400 dark:from-rose-400 dark:to-rose-200 bg-clip-text text-transparent',
    green: 'bg-gradient-to-r from-green-700 to-green-400 dark:from-green-400 dark:to-green-200 bg-clip-text text-transparent',
    teal: 'bg-gradient-to-r from-teal-700 to-teal-400 dark:from-teal-400 dark:to-teal-200 bg-clip-text text-transparent',
    orange: 'bg-gradient-to-r from-orange-700 to-orange-400 dark:from-orange-400 dark:to-orange-200 bg-clip-text text-transparent',
    purple: 'bg-gradient-to-r from-purple-700 to-purple-400 dark:from-purple-400 dark:to-purple-200 bg-clip-text text-transparent',
    indigo: 'bg-gradient-to-r from-indigo-700 to-indigo-400 dark:from-indigo-400 dark:to-indigo-200 bg-clip-text text-transparent',
    yellow: 'bg-gradient-to-r from-yellow-700 to-yellow-400 dark:from-yellow-400 dark:to-yellow-200 bg-clip-text text-transparent',
    gray: 'bg-gradient-to-r from-gray-700 to-gray-400 dark:from-gray-400 dark:to-gray-200 bg-clip-text text-transparent',
    charcoal: 'bg-gradient-to-r from-zinc-950 via-zinc-800 to-zinc-600 dark:from-white dark:via-zinc-200 dark:to-zinc-400 bg-clip-text text-transparent',
    ink: 'bg-gradient-to-r from-zinc-950 via-zinc-800 to-zinc-600 dark:from-white dark:via-zinc-200 dark:to-zinc-400 bg-clip-text text-transparent',
  };

  let textClass = 'text-zinc-900 dark:text-white';
  if (colorMode === 'gradient' && gradient !== 'default' && gradientClasses[gradient]) {
    textClass = gradientClasses[gradient];
  } else if (solidTextClasses[gradient]) {
    textClass = solidTextClasses[gradient];
  }

  // 4. 아이콘 컬러 클래스
  const iconColorClasses: Record<string, string> = {
    default: 'text-[var(--google-blue)]',
    blue: 'text-[var(--google-blue)] dark:text-[#8ab4f8]',
    cyan: 'text-sky-600 dark:text-sky-400',
    red: 'text-[var(--google-red)] dark:text-[#f28b82]',
    rose: 'text-rose-500 dark:text-rose-400',
    green: 'text-[var(--google-green)] dark:text-[#81c995]',
    teal: 'text-teal-600 dark:text-teal-400',
    orange: 'text-orange-600 dark:text-orange-400',
    purple: 'text-purple-600 dark:text-purple-400',
    indigo: 'text-indigo-600 dark:text-indigo-400',
    yellow: 'text-amber-600 dark:text-amber-400',
    gray: 'text-gray-600 dark:text-gray-400',
    charcoal: 'text-zinc-700 dark:text-zinc-300',
    ink: 'text-zinc-700 dark:text-zinc-300',
  };

  const resolvedIconColor = iconColorClasses[gradient] || iconColorClasses.default;

  return (
    <Tag className={`${baseClass} ${className}`} {...props}>
      {icon && <span className={`shrink-0 flex items-center ${resolvedIconColor}`}>{icon}</span>}
      <span className={`min-w-0 ${textClass}`}>{children}</span>
    </Tag>
  );
}
