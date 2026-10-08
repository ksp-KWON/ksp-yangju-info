'use client';

import React, { useState } from 'react';
import AppIcon from '@/components/ui/AppIcon';
import PremiumCard from '@/components/ui/PremiumCard';
import PremiumButton from '@/components/ui/PremiumButton';

interface ShareButtonsProps {
  title: string;
  url?: string;
}

export default function ShareButtons({ title, url }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const getShareUrl = () => {
    return url || (typeof window !== 'undefined' ? window.location.href : '');
  };

  const handleCopy = async () => {
    const shareUrl = getShareUrl();
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = shareUrl;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      alert('링크 복사에 실패했습니다.');
    }
  };

  const handleKakaoShare = () => {
    const shareUrl = getShareUrl();
    const kakaoUrl = `https://sharer.kakao.com/talk/friends/picker/link?url=${encodeURIComponent(
      shareUrl
    )}&text=${encodeURIComponent(title)}`;
    window.open(kakaoUrl, '_blank', 'width=500,height=600');
  };

  const handleNativeShare = async () => {
    const shareUrl = getShareUrl();
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title,
          url: shareUrl,
        });
      } catch {
        // User cancelled
      }
    } else {
      handleCopy();
    }
  };

  return (
    <PremiumCard
      borderColor="default"
      hoverEffect={false}
      watermarkIcon="share"
      className="my-8 !p-5 sm:!p-6"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
        {/* 좌측 텍스트 안내 영역 */}
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-[10.5px] font-extrabold tracking-wider border border-zinc-200 dark:border-zinc-700">
            <AppIcon name="link" size={11} strokeWidth={2.5} />
            <span>이웃과 함께 나누는 의정부 혜택</span>
          </div>
          <h4 className="text-sm sm:text-base font-extrabold text-zinc-950 dark:text-white tracking-tight leading-snug break-keep">
            놓치기 아까운 의정부 생활 정보, 가족·지인에게 알려주세요
          </h4>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-normal leading-relaxed">
            헛걸음 방지 팁과 핵심 신청 요강을 카카오톡으로 간편하게 공유할 수 있습니다.
          </p>
        </div>

        {/* 우측 전사 표준 PremiumButton 그룹 */}
        <div className="flex items-center gap-2.5 shrink-0 w-full md:w-auto">
          {/* 카카오톡 공유 버튼 */}
          <PremiumButton
            variant="kakao"
            size="md"
            icon="chat"
            onClick={handleKakaoShare}
            className="flex-1 md:flex-none"
          >
            카카오톡 공유
          </PremiumButton>

          {/* URL 복사 버튼 */}
          <PremiumButton
            variant={copied ? 'emerald' : 'primary'}
            size="md"
            icon={copied ? 'check' : 'copy'}
            onClick={handleCopy}
            className="flex-1 md:flex-none"
          >
            {copied ? '링크 복사 완료!' : 'URL 링크 복사'}
          </PremiumButton>

          {/* 모바일 OS 기본 공유 버튼 */}
          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <PremiumButton
              variant="outline"
              size="md"
              icon="share"
              onClick={handleNativeShare}
              aria-label="OS 공유창 열기"
              className="md:hidden !px-3"
            >
              공유
            </PremiumButton>
          )}
        </div>
      </div>
    </PremiumCard>
  );
}
