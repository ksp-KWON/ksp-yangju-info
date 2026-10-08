import Link from 'next/link';
import { Metadata } from 'next';
import PageHeaderBanner from '@/components/ui/PageHeaderBanner';
import PremiumCard from '@/components/ui/PremiumCard';
import AppIcon from '@/components/ui/AppIcon';

export const metadata: Metadata = {
  title: '사이트 소개 및 운영 철학',
  description: '의정부 시민을 위한 생활 복지·의료 정보의 운영 목적과 정보 출처를 투명하게 안내합니다.',
  alternates: {
    canonical: '/about',
  },
};

export default function AboutPage() {

  return (
    <div className="max-w-4xl mx-auto px-2 sm:px-4 py-6 sm:py-10 space-y-8">
      {/* 1. 상단 브레드크럼 */}
      <nav className="flex text-xs text-zinc-500 dark:text-zinc-400" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1.5 font-medium">
          <li>
            <Link href="/" className="hover:text-zinc-950 dark:hover:text-white transition-colors flex items-center gap-1">
              <AppIcon name="home" size={13} strokeWidth={2} />
              홈
            </Link>
          </li>
          <li>
            <span className="mx-1 text-zinc-400">/</span>
          </li>
          <li className="text-zinc-900 dark:text-white font-bold">플랫폼 소개</li>
        </ol>
      </nav>

      {/* 2. 메인 헤더 배너 */}
      <PageHeaderBanner
        badgeText="투명성과 공공성"
        badgeTone="emerald"
        badgeIcon="shield-check"
        title="의정부 건강·생활 정보 포털의 사명"
        description="시민들에게 꼭 필요한 공공 혜택과 응급의료 정보가 복잡한 행정 사이트에 흩어져 있어 놓치는 일이 없도록, 공공데이터와 각 기관의 공식 안내를 바탕으로 가장 읽기 쉽고 직관적인 형태로 큐레이션합니다."
        watermarkIcon="shield-check"
      >
      </PageHeaderBanner>

      {/* 3. 3대 핵심 가치 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
        <PremiumCard hoverEffect={true} watermarkIcon="shield" className="p-6 space-y-2">
          <div className="w-9 h-9 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
            <AppIcon name="shield-check" size={18} strokeWidth={2} />
          </div>
          <h3 className="text-base font-bold text-zinc-950 dark:text-white pt-2">공식 출처 안내</h3>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-normal">
            각 기관의 공식 안내와 공개 자료를 기반으로 정보를 정리하며, 실시간 병상·운영 여부는 공식 사이트 링크로 안내합니다.
          </p>
        </PremiumCard>

        <PremiumCard hoverEffect={true} watermarkIcon="zap" className="p-6 space-y-2">
          <div className="w-9 h-9 bg-sky-50 text-sky-700 dark:bg-sky-950/70 dark:text-sky-300 flex items-center justify-center border border-sky-200 dark:border-sky-800">
            <AppIcon name="zap" size={18} strokeWidth={2} />
          </div>
          <h3 className="text-base font-bold text-zinc-950 dark:text-white pt-2">생활 정보 안내</h3>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-normal">
            응급실 위치·전화 안내와 국가건강검진·민원 등 생활 필수 안내를 알기 쉽게 정리합니다.
          </p>
        </PremiumCard>

        <PremiumCard hoverEffect={true} watermarkIcon="heart" className="p-6 space-y-2">
          <div className="w-9 h-9 bg-rose-50 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 flex items-center justify-center border border-rose-200 dark:border-rose-800">
            <AppIcon name="heart" size={18} strokeWidth={2} />
          </div>
          <h3 className="text-base font-bold text-zinc-950 dark:text-white pt-2">시민 편의성 최우선</h3>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-normal">
            회원가입이나 개인정보 수집 없이 모든 공공지도와 혜택 안내를 누구나 100% 무료로 자유롭게 열람할 수 있습니다.
          </p>
        </PremiumCard>
      </div>

      {/* 4. 데이터 출처 명시 (E-E-A-T) */}
      <div className="p-6 sm:p-8 bg-zinc-50/70 dark:bg-[#202124] border border-gray-200/90 dark:border-zinc-800 shadow-[0_2px_8px_rgba(0,0,0,0.03)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.2)] space-y-4 rounded-none">
        <h3 className="text-base sm:text-lg font-bold text-zinc-950 dark:text-white flex items-center gap-2">
          <AppIcon name="file-text" size={18} strokeWidth={2} className="text-zinc-600 dark:text-zinc-400" />
          <span>공식 정보 출처</span>
        </h3>
        <ul className="space-y-2.5 text-xs sm:text-sm font-normal text-zinc-700 dark:text-zinc-300">
          <li className="flex items-start gap-2">
            <AppIcon name="check" size={14} strokeWidth={2.5} className="text-emerald-600 dark:text-emerald-400 mt-1 shrink-0" />
            <span><strong className="text-zinc-900 dark:text-white">응급의료</strong> : 관내 의료기관 공개 정보를 직접 정리했으며, 실시간 병상·운영 여부는 응급의료정보제공(E-GEN)·휴일지킴이약국 공식 사이트에서 확인</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
