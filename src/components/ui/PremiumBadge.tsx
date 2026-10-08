import React from 'react';

export type BadgeColor = 'charcoal' | 'ink' | 'green' | 'teal' | 'blue' | 'indigo' | 'purple' | 'amber' | 'rose' | 'gray';

export interface PremiumBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  color?: BadgeColor;
}

export default function PremiumBadge({
  children,
  className = '',
  color = 'charcoal',
  ...props
}: PremiumBadgeProps) {
  let colorClass = 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 border-zinc-200/80 dark:border-zinc-700';

  if (color === 'blue') {
    colorClass = 'bg-[#e8f0fe] text-[var(--google-blue)] dark:bg-[#174ea6]/20 dark:text-[#8ab4f8] border-[#d2e3fc] dark:border-[#174ea6]/40';
  } else if (color === 'green' || color === 'teal') {
    colorClass = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40';
  } else if (color === 'indigo') {
    colorClass = 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/40';
  } else if (color === 'purple') {
    colorClass = 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800/40';
  } else if (color === 'amber') {
    colorClass = 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800/40';
  } else if (color === 'rose') {
    colorClass = 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800/40';
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-[11px] sm:text-xs font-bold rounded-none shadow-[0_1px_2px_rgba(0,0,0,0.03)] border ${colorClass} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
