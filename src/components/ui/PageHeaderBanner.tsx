import React from 'react';
import AppIcon, { type AppIconName } from './AppIcon';

export type HeaderBadgeTone = 'emerald' | 'sky' | 'amber' | 'purple' | 'zinc';

export interface PageHeaderBannerProps {
  badgeText?: string;
  badgeTone?: HeaderBadgeTone;
  badgeIcon?: AppIconName;
  title: React.ReactNode;
  description?: React.ReactNode;
  watermarkIcon?: AppIconName;
  children?: React.ReactNode;
  className?: string;
  align?: 'left' | 'center';
}

const BADGE_TONE_STYLES: Record<HeaderBadgeTone, string> = {
  emerald: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  sky: 'bg-sky-50 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border-sky-200 dark:border-sky-800',
  amber: 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  purple: 'bg-purple-50 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  zinc: 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700',
};

const BADGE_ICON_COLORS: Record<HeaderBadgeTone, string> = {
  emerald: 'text-emerald-600 dark:text-emerald-400',
  sky: 'text-sky-600 dark:text-sky-400',
  amber: 'text-amber-600 dark:text-amber-400',
  purple: 'text-purple-600 dark:text-purple-400',
  zinc: 'text-zinc-600 dark:text-zinc-400',
};

export default function PageHeaderBanner({
  badgeText,
  badgeTone = 'zinc',
  badgeIcon,
  title,
  description,
  watermarkIcon,
  children,
  className = '',
  align = 'left',
}: PageHeaderBannerProps) {
  const isCenter = align === 'center';

  return (
    <div
      className={`relative overflow-hidden rounded-none border border-gray-200/90 dark:border-zinc-800 bg-white dark:bg-[#202124] shadow-[0_2px_8px_rgba(0,0,0,0.03)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.2)] hover:shadow-md p-6 sm:p-10 group transition-all duration-300 ${
        isCenter ? 'text-center' : 'text-left'
      } ${className}`}
    >
      {/* 워터마크 라인 SVG */}
      {watermarkIcon && (
        <div className="absolute -right-6 -bottom-6 text-zinc-900/[0.03] dark:text-zinc-100/[0.05] pointer-events-none group-hover:scale-105 transition-transform duration-500 z-0 select-none">
          <AppIcon name={watermarkIcon} size={180} strokeWidth={1.5} />
        </div>
      )}

      <div className={`relative z-10 space-y-3 ${isCenter ? 'max-w-2xl mx-auto' : ''}`}>
        {badgeText && (
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold uppercase tracking-wider border rounded-none shadow-2xs ${BADGE_TONE_STYLES[badgeTone]}`}
          >
            {badgeIcon && (
              <AppIcon name={badgeIcon} size={14} strokeWidth={2} className={BADGE_ICON_COLORS[badgeTone]} />
            )}
            <span>{badgeText}</span>
          </div>
        )}

        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-zinc-950 dark:text-white">
          {title}
        </h1>

        {description && (
          <p
            className={`text-sm sm:text-base text-zinc-600 dark:text-zinc-400 font-normal leading-relaxed break-keep ${
              isCenter ? 'max-w-lg mx-auto' : 'max-w-2xl'
            }`}
          >
            {description}
          </p>
        )}

        {children}
      </div>
    </div>
  );
}
