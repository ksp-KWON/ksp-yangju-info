'use client';

import React from 'react';
import Link from 'next/link';
import AppIcon, { type AppIconName } from '@/components/ui/AppIcon';
import TopGradientLine from '@/components/ui/TopGradientLine';

export interface CivicServiceBannerProps {
  href: string;
  themeColor: 'green' | 'blue';
  icon: AppIconName;
  categoryBadge: string;
  statusBadge: string;
  statusPulse?: boolean;
  title: string;
  description: string;
  buttonText: string;
  backgroundImage?: {
    light: string;
    dark?: string;
    alt: string;
  };
  watermarkIcon?: AppIconName;
  className?: string;
}

export default function CivicServiceBanner({
  href,
  themeColor,
  icon,
  categoryBadge,
  statusBadge,
  statusPulse = true,
  title,
  description,
  buttonText,
  backgroundImage,
  watermarkIcon,
  className = '',
}: CivicServiceBannerProps) {
  const isGreen = themeColor === 'green';

  return (
    <div className={`w-full ${className}`}>
      <Link href={href} className="group block w-full select-none">
        <div className="relative overflow-hidden rounded-none border border-gray-200/90 dark:border-zinc-800 bg-white dark:bg-[#202124] shadow-[0_0_20px_rgba(0,0,0,0.08)] dark:shadow-[0_0_20px_rgba(0,0,0,0.50)] hover:shadow-[0_0_40px_rgba(0,0,0,0.18),0_0_15px_rgba(0,0,0,0.10)] dark:hover:shadow-[0_0_40px_rgba(0,0,0,0.70),0_0_15px_rgba(0,0,0,0.50)] hover:-translate-y-1 hover:border-zinc-800 dark:hover:border-zinc-200 transition-all duration-300">
          {/* ── 0. 상단 심볼 그라데이션 공통 라인 ── */}
          <TopGradientLine color={themeColor} />

          {/* ── 1. 옵션: 실측 지도 배경 이미지 ── */}
          {backgroundImage && (
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none transition-transform duration-700 group-hover:scale-105">
              {/* 라이트 모드 배경 */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={backgroundImage.light}
                alt={backgroundImage.alt}
                className="absolute inset-0 w-full h-full object-cover object-center dark:hidden opacity-95"
                loading="lazy"
              />
              {/* 다크 모드 배경 */}
              {backgroundImage.dark && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={backgroundImage.dark}
                  alt={`${backgroundImage.alt} (다크모드)`}
                  className="absolute inset-0 w-full h-full object-cover object-center hidden dark:block opacity-95"
                  loading="lazy"
                />
              )}
              {/* 앰비언트 오버레이 */}
              <div className="absolute inset-0 bg-gradient-to-r from-white/92 via-white/70 via-50% to-white/10 dark:from-[#181a1d]/92 dark:via-[#181a1d]/70 dark:via-50% dark:to-[#181a1d]/15 backdrop-blur-[0.5px]" />
            </div>
          )}

          {/* ── 2. 옵션: 배경 수묵 워터마크 ── */}
          {watermarkIcon && (
            <div className={`absolute -right-4 -bottom-6 ${isGreen ? 'text-emerald-500/[0.04] dark:text-emerald-400/[0.05]' : 'text-blue-500/[0.04] dark:text-blue-400/[0.05]'} pointer-events-none transition-transform duration-500 group-hover:scale-105 z-0`}>
              <AppIcon name={watermarkIcon} size={140} strokeWidth={1.5} />
            </div>
          )}

          {/* ── 3. 통일된 전면 카드 콘텐츠 (동일한 3단계 층위) ── */}
          <div className="relative z-10 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4 w-full">
            <div className="flex items-center gap-3.5 min-w-0">
              {/* 40px 규격 통일 스퀘어 아이콘 */}
              <div className={`w-10 h-10 rounded-none flex items-center justify-center shrink-0 shadow-xs transition-colors duration-300 ${
                isGreen
                  ? 'bg-emerald-600 dark:bg-emerald-600 text-white border border-emerald-500/80 group-hover:bg-emerald-700'
                  : 'bg-blue-50 dark:bg-blue-950/50 text-[var(--google-blue)] dark:text-[#8ab4f8] border border-blue-200 dark:border-blue-800/80 group-hover:bg-[var(--google-blue)] group-hover:text-white'
              }`}>
                <AppIcon name={icon} size={20} strokeWidth={2.5} />
              </div>

              <div className="min-w-0">
                {/* 1행: 카테고리 뱃지 + 실시간 상태 뱃지 (높이 100% 동일) */}
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 text-[11px] font-bold rounded-none ${
                    isGreen
                      ? 'bg-emerald-700 text-white shadow-2xs'
                      : 'bg-[#e8f0fe] text-[var(--google-blue)] dark:bg-[#174ea6]/30 dark:text-[#8ab4f8] border border-[#d2e3fc]/80 dark:border-[#174ea6]/40'
                  }`}>
                    {categoryBadge}
                  </span>
                  <span className={`inline-flex items-center gap-1 text-[11px] font-bold ${
                    isGreen
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : 'text-emerald-600 dark:text-emerald-400'
                  }`}>
                    {statusPulse && (
                      <span className={`w-1.5 h-1.5 rounded-full ${isGreen ? 'bg-emerald-600' : 'bg-emerald-500'} animate-pulse`} />
                    )}
                    {statusBadge}
                  </span>
                </div>

                {/* 2행: 메인 타이틀 */}
                <h3 className={`text-sm sm:text-base font-extrabold text-[#202124] dark:text-white transition-colors truncate mt-1 ${
                  isGreen
                    ? 'group-hover:text-emerald-700 dark:group-hover:text-emerald-400'
                    : 'group-hover:text-[var(--google-blue)] dark:group-hover:text-[#8ab4f8]'
                }`}>
                  {title}
                </h3>

                {/* 3행: 서브 설명문 */}
                <p className="text-xs text-zinc-600 dark:text-zinc-400 font-normal truncate mt-1">
                  {description}
                </p>
              </div>
            </div>

            {/* 우측 바로가기 액션 버튼 (규격 100% 동일) */}
            <div className="flex justify-end sm:justify-center shrink-0">
              <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-white text-xs font-bold rounded-none shadow-xs transition-colors ${
                isGreen
                  ? 'bg-emerald-700 group-hover:bg-emerald-800'
                  : 'bg-[var(--google-blue)] group-hover:bg-[#1557b0]'
              }`}>
                <span>{buttonText}</span>
                <AppIcon name="chevron-right" size={13} strokeWidth={2.5} className="group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
