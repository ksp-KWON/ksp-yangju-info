import React from 'react';
import type { BorderColor } from './PremiumCard';

export const TOP_GRADIENT_LINES: Record<BorderColor, string> = {
  green: 'bg-gradient-to-r from-emerald-600 via-teal-400 to-emerald-500',
  blue: 'bg-gradient-to-r from-[var(--google-blue)] via-sky-400 to-indigo-500',
  cyan: 'bg-gradient-to-r from-sky-500 via-cyan-400 to-blue-500',
  teal: 'bg-gradient-to-r from-teal-500 via-emerald-400 to-teal-600',
  red: 'bg-gradient-to-r from-[var(--google-red)] via-rose-400 to-red-600',
  rose: 'bg-gradient-to-r from-rose-500 via-pink-400 to-rose-600',
  orange: 'bg-gradient-to-r from-orange-500 via-amber-400 to-orange-600',
  yellow: 'bg-gradient-to-r from-[var(--google-yellow)] via-amber-300 to-yellow-500',
  purple: 'bg-gradient-to-r from-purple-500 via-fuchsia-400 to-purple-600',
  indigo: 'bg-gradient-to-r from-indigo-500 via-purple-400 to-indigo-600',
  charcoal: 'bg-gradient-to-r from-zinc-800 via-zinc-600 to-zinc-800 dark:from-zinc-200 dark:via-zinc-400 dark:to-zinc-200',
  ink: 'bg-gradient-to-r from-zinc-900 via-zinc-700 to-zinc-900 dark:from-zinc-100 dark:via-zinc-300 dark:to-zinc-100',
  default: 'bg-gradient-to-r from-gray-400 via-gray-300 to-gray-500 dark:from-zinc-600 dark:via-zinc-500 dark:to-zinc-700',
};

interface TopGradientLineProps {
  color?: BorderColor;
  className?: string;
}

export default function TopGradientLine({ color = 'default', className = '' }: TopGradientLineProps) {
  const gradientClass = TOP_GRADIENT_LINES[color] || TOP_GRADIENT_LINES.default;
  return (
    <div
      aria-hidden="true"
      className={`absolute top-0 left-0 right-0 h-1 ${gradientClass} z-20 pointer-events-none ${className}`}
    />
  );
}
