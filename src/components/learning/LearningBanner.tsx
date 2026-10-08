'use client';

import React from 'react';
import CivicServiceBanner from '@/components/ui/CivicServiceBanner';

interface LearningBannerProps {
  className?: string;
  totalCourses: number;
}

export default function LearningBanner({ className = '', totalCourses }: LearningBannerProps) {
  return (
    <CivicServiceBanner
      href="/services/learning"
      themeColor="blue"
      icon="book"
      categoryBadge="배움·평생교육"
      statusBadge={`실시간 접수중 ${totalCourses}개`}
      statusPulse
      title="의정부시 실시간 평생학습 강좌 지도"
      description="도서관·주민센터·청소년수련관 무료 강좌 및 야간·주말 배움을 한눈에 찾으세요."
      buttonText="강좌 지도 보기"
      watermarkIcon="compass"
      className={className}
    />
  );
}
