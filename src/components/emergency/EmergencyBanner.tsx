'use client';

import React from 'react';
import CivicServiceBanner from '@/components/ui/CivicServiceBanner';

interface EmergencyBannerProps {
  className?: string;
}

export default function EmergencyBanner({ className = '' }: EmergencyBannerProps) {
  return (
    <CivicServiceBanner
      href="/services/emergency"
      themeColor="green"
      icon="hospital"
      categoryBadge="야간·응급의료"
      statusBadge="24시간 실시간 병상 안내"
      statusPulse
      title="의정부시 24시간 응급실 안내"
      description="의정부성모병원·을지대병원 응급실 위치, 비상전화번호, 진료과목을 지도에서 확인하세요."
      buttonText="지도 보기"
      backgroundImage={{
        light: '/images/emergency-map-bg.png',
        dark: '/images/emergency-map-bg-dark.png',
        alt: '의정부시 24시간 응급의료 지도',
      }}
      className={className}
    />
  );
}
