import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import PageHeaderBanner from '@/components/ui/PageHeaderBanner';
import PremiumCard from '@/components/ui/PremiumCard';
import CommonBox from '@/components/blog/CommonBox';
import PremiumButton from '@/components/ui/PremiumButton';
import AppIcon from '@/components/ui/AppIcon';
import { EMERGENCY_PLACES, getEmergencyPlaceBySlug } from '@/lib/data/emergency-places';

interface PlacePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return EMERGENCY_PLACES.map((place) => ({
    slug: place.slug,
  }));
}

export async function generateMetadata({ params }: PlacePageProps): Promise<Metadata> {
  const { slug } = await params;
  const place = getEmergencyPlaceBySlug(slug);

  if (!place) {
    return {
      title: '응급의료 기관 안내',
    };
  }

  return {
    title: `${place.name} - 진료시간·응급실·주차 안내`,
    description: `${place.name}의 위치(${place.address}), 전화번호(${place.tel}), 야간 및 휴일 진료시간, 주차 안내 및 응급 처치 정보입니다.`,
    alternates: {
      canonical: `/services/emergency/${place.slug}`,
    },
  };
}

export default async function EmergencyPlaceDetailPage({ params }: PlacePageProps) {
  const { slug } = await params;
  const place = getEmergencyPlaceBySlug(slug);

  if (!place) {
    notFound();
  }

  // Schema.org W3C 구조화 데이터 (Google/Naver Rich Snippets)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': place.type === 'pharmacy' ? 'Pharmacy' : 'MedicalBusiness',
    name: place.name,
    address: {
      '@type': 'PostalAddress',
      streetAddress: place.address,
      addressLocality: '의정부시',
      addressRegion: '경기도',
      addressCountry: 'KR',
    },
    telephone: place.tel,
    geo: {
      '@type': 'GeoCoordinates',
      latitude: place.lat,
      longitude: place.lng,
    },
    openingHours: place.hours.weekday,
    description: place.description,
  };

  const isPharmacy = place.type === 'pharmacy';
  const kakaoMapUrl = `https://map.kakao.com/link/to/${encodeURIComponent(place.name)},${place.lat},${place.lng}`;

  return (
    <div className="space-y-8">
      {/* 구조화 데이터 주입 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ── [구역 1] 헤더 배너 ── */}
      <PageHeaderBanner
        badgeText={place.typeName}
        badgeTone="zinc"
        badgeIcon={isPharmacy ? 'stethoscope' : 'hospital'}
        title={place.name}
        description={place.description}
        watermarkIcon={isPharmacy ? 'stethoscope' : 'hospital'}
      >
        <div className="flex flex-wrap gap-2 pt-2">
          <PremiumButton
            href={`tel:${place.tel}`}
            variant="primary"
            size="sm"
            icon="phone"
          >
            전화 연결 ({place.tel})
          </PremiumButton>

          <PremiumButton
            href={kakaoMapUrl}
            isExternal={true}
            variant="secondary"
            size="sm"
            icon="navigation"
          >
            카카오맵 길찾기
          </PremiumButton>

          <PremiumButton
            href="/services/emergency"
            variant="outline"
            size="sm"
            icon="hospital"
          >
            의정부 전체 지도
          </PremiumButton>
        </div>
      </PageHeaderBanner>

      {/* ── [구역 2] 핵심 운영 정보 벤토 그리드 ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* 운영 시간 안내 카드 */}
        <PremiumCard borderColor="default" hoverEffect={false} watermarkIcon="clock" className="!p-5">
          <div className="flex items-center gap-2 mb-3.5 pb-2 border-b border-gray-100 dark:border-zinc-800">
            <AppIcon name="clock" size={17} strokeWidth={2.5} className="text-zinc-900 dark:text-zinc-100" />
            <h3 className="text-sm sm:text-base font-extrabold text-zinc-950 dark:text-white">
              운영 및 진료 시간
            </h3>
          </div>
          <dl className="space-y-2.5 text-xs sm:text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-zinc-500 dark:text-zinc-400 font-medium">평일 진료/영업</dt>
              <dd className="font-extrabold text-zinc-900 dark:text-zinc-100">{place.hours.weekday}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-zinc-500 dark:text-zinc-400 font-medium">주말(토·일요일)</dt>
              <dd className="font-extrabold text-zinc-900 dark:text-zinc-100">{place.hours.weekend}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-zinc-500 dark:text-zinc-400 font-medium">공휴일 운영</dt>
              <dd className="font-extrabold text-zinc-900 dark:text-zinc-100">{place.hours.holiday}</dd>
            </div>
          </dl>
        </PremiumCard>

        {/* 위치 및 주차 안내 카드 */}
        <PremiumCard borderColor="default" hoverEffect={false} watermarkIcon="compass" className="!p-5">
          <div className="flex items-center gap-2 mb-3.5 pb-2 border-b border-gray-100 dark:border-zinc-800">
            <AppIcon name="compass" size={17} strokeWidth={2.5} className="text-zinc-900 dark:text-zinc-100" />
            <h3 className="text-sm sm:text-base font-extrabold text-zinc-950 dark:text-white">
              위치 및 편의 정보
            </h3>
          </div>
          <dl className="space-y-2.5 text-xs sm:text-sm">
            <div className="flex flex-col gap-0.5">
              <dt className="text-zinc-500 dark:text-zinc-400 font-medium">도로명 주소</dt>
              <dd className="font-bold text-zinc-900 dark:text-zinc-100">{place.address}</dd>
            </div>
            <div className="flex items-center justify-between pt-1">
              <dt className="text-zinc-500 dark:text-zinc-400 font-medium">대표 전화</dt>
              <dd className="font-extrabold text-zinc-900 dark:text-zinc-100">
                <a href={`tel:${place.tel}`} className="hover:underline">{place.tel}</a>
              </dd>
            </div>
            {place.parkingInfo && (
              <div className="flex items-center justify-between">
                <dt className="text-zinc-500 dark:text-zinc-400 font-medium">주차 안내</dt>
                <dd className="font-bold text-zinc-900 dark:text-zinc-100">{place.parkingInfo}</dd>
              </div>
            )}
          </dl>
        </PremiumCard>
      </div>

      {/* ── [구역 3] 주요 특장점 및 진료과목 ── */}
      {(place.features.length > 0 || (place.departments && place.departments.length > 0)) && (
        <CommonBox
          title="기관 주요 특장점 및 이용 안내"
          icon={<AppIcon name="shield-check" size={18} strokeWidth={2.5} />}
        >
          <div className="space-y-4">
            <ul className="space-y-2">
              {place.features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-zinc-800 dark:text-zinc-200">
                  <AppIcon name="check" size={14} strokeWidth={3} className="text-zinc-900 dark:text-zinc-100 mt-1 shrink-0" />
                  <span className="font-medium leading-relaxed">{feature}</span>
                </li>
              ))}
            </ul>

            {place.departments && place.departments.length > 0 && (
              <div className="pt-3 border-t border-gray-100 dark:border-zinc-800">
                <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 block mb-2">주요 진료과목</span>
                <div className="flex flex-wrap gap-1.5">
                  {place.departments.map((dept, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-medium border border-zinc-200 dark:border-zinc-700"
                    >
                      {dept}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CommonBox>
      )}

      {/* ── [구역 4] 의정부 다른 응급기관 바로가기 ── */}
      <div className="pt-4 border-t border-gray-200/80 dark:border-zinc-800">
        <h4 className="text-sm font-extrabold text-zinc-950 dark:text-white mb-3 flex items-center gap-2">
          <AppIcon name="hospital" size={16} strokeWidth={2.5} />
          <span>의정부시 관내 다른 응급의료 기관</span>
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {EMERGENCY_PLACES.filter((p) => p.slug !== place.slug).slice(0, 3).map((other) => (
            <Link
              key={other.slug}
              href={`/services/emergency/${other.slug}`}
              className="p-3.5 bg-white dark:bg-[#202124] border border-gray-200/90 dark:border-zinc-800 hover:border-[var(--google-blue)] hover:shadow-[0_12px_40px_rgba(26,115,232,0.18)] shadow-[0_2px_8px_rgba(0,0,0,0.03)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 transition-all group flex flex-col justify-between"
            >
              <div>
                <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 border border-zinc-200 dark:border-zinc-700">
                  {other.typeName}
                </span>
                <h5 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white mt-1.5 truncate group-hover:underline">
                  {other.name}
                </h5>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                  {other.address}
                </p>
              </div>
              <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 flex items-center justify-between mt-2 pt-2 border-t border-gray-100 dark:border-zinc-800/60">
                <span>상세 정보</span>
                <AppIcon name="chevron-right" size={11} strokeWidth={2.5} className="group-hover:translate-x-0.5 transition-transform" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
