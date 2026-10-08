'use client';

import { useEffect } from 'react';
import AppIcon from '@/components/ui/AppIcon';
import PremiumCard from '@/components/ui/PremiumCard';
import PremiumButton from '@/components/ui/PremiumButton';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 에러 리포팅 서비스나 콘솔에 에러 기록
    console.error('Next.js 런타임 글로벌 에러 감지:', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-5 text-center">
      <PremiumCard hoverEffect={false} className="p-8 md:p-12 max-w-lg w-full">
        <div className="w-14 h-14 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 rounded-none flex items-center justify-center mx-auto mb-6">
          <AppIcon name="shield-alert" size={28} strokeWidth={2} />
        </div>
        <h2 className="text-xl md:text-2xl font-extrabold mb-3 text-zinc-950 dark:text-white tracking-tight">
          화면을 불러오는 중 문제가 발생했습니다
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-8 leading-relaxed">
          일시적인 서버 오류이거나 네트워크 문제일 수 있습니다. <br className="hidden sm:block" />
          아래 버튼을 눌러 다시 시도하시거나 홈으로 이동해 주세요.
          <br /><br />
          <span className="inline-block px-3 py-1 bg-zinc-50 dark:bg-zinc-900 rounded-none text-xs font-mono text-rose-600 dark:text-rose-400 border border-zinc-200 dark:border-zinc-800">
            {error.message || '알 수 없는 렌더링 오류'}
          </span>
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <PremiumButton
            onClick={() => reset()}
            variant="danger"
            size="md"
            className="w-full sm:w-auto"
          >
            화면 다시 불러오기
          </PremiumButton>
          <PremiumButton
            href="/"
            variant="outline"
            size="md"
            className="w-full sm:w-auto"
          >
            홈으로 돌아가기
          </PremiumButton>
        </div>
      </PremiumCard>
    </div>
  );
}
