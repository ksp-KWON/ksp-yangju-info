'use client';

import React, { ReactNode } from 'react';

interface Props {
  mainContent: ReactNode;
  sidebarContent?: ReactNode | null;
}

export default function SmartStickyLayout({ mainContent, sidebarContent }: Props) {
  return (
    <div className="mx-auto w-full sm:w-[92vw] xl:w-[85vw] max-w-7xl px-2 sm:px-5 py-6 sm:py-8 flex flex-col lg:flex-row gap-6 lg:gap-8 items-stretch">
      {/* 본문 영역 (73% 비율, 보상스쿨 최적 표준 동기화) */}
      <main className="w-full lg:w-[73%] flex-1 min-w-0 transition-all duration-300">
        {mainContent}
      </main>

      {/* 사이드바 영역 (27% 비율, 부모 높이 전폭 스트레치 + 내부 100% sticky 고정) */}
      {sidebarContent && (
        <aside className="hidden lg:block w-full lg:w-[27%] relative transition-all duration-300 lg:px-0">
          <div className="sticky top-[80px] w-full">
            {sidebarContent}
          </div>
        </aside>
      )}
    </div>
  );
}
