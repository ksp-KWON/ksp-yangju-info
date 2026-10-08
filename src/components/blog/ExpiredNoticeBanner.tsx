'use client';

import { useState, useEffect } from 'react';
import AppIcon from '@/components/ui/AppIcon';

interface ExpiredNoticeBannerProps {
  expiresAt?: string;
  sourceLink?: string;
}

export default function ExpiredNoticeBanner({ expiresAt, sourceLink }: ExpiredNoticeBannerProps) {
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!expiresAt) return;
    // KST(UTC+9) 기준 방문 시점의 현재 날짜(YYYY-MM-DD) 계산
    const todayKST = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' });

    // expiresAt 마감 당일까지 유효: 오늘 날짜가 expiresAt을 초과하면 마감 처리
    if (todayKST > expiresAt) {
      setIsExpired(true);
    }
  }, [expiresAt]);

  // 서버 렌더링 시 및 마감일 미경과 시 표시 안 함 (Hydration 불일치 방지)
  if (!isExpired) return null;

  return (
    <div className="w-full bg-zinc-100 dark:bg-zinc-800/80 border-l-4 border-zinc-500 p-4 text-sm text-zinc-700 dark:text-zinc-300">
      <div className="flex items-start gap-3">
        <AppIcon name="warning" size={18} className="text-zinc-500 shrink-0 mt-0.5" />
        <div className="flex-1 space-y-1">
          <p className="font-semibold text-zinc-900 dark:text-zinc-100">
            이 안내의 기한이 지났습니다.
          </p>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            최신 내용은 의정부시 공식 포털에서 확인하세요.
            {sourceLink && (
              <a
                href={sourceLink}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 underline font-medium text-zinc-800 dark:text-zinc-200 hover:text-zinc-950 dark:hover:text-white"
              >
                공식 출처 바로가기 →
              </a>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
