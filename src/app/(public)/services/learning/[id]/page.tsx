import fs from 'fs';
import path from 'path';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import PageHeaderBanner from '@/components/ui/PageHeaderBanner';
import PremiumCard from '@/components/ui/PremiumCard';
import CommonBox from '@/components/blog/CommonBox';
import PremiumButton from '@/components/ui/PremiumButton';
import HighlightBadge from '@/components/ui/HighlightBadge';
import AppIcon from '@/components/ui/AppIcon';
import { SITE_URL } from '@/lib/constants';

interface CourseDetail {
  id: string;
  num: string;
  learningId?: string;
  title: string;
  org: string;
  dong: string;
  address: string;
  lat: number;
  lng: number;
  eduPeriod: string;
  applyPeriod: string;
  capacity: string;
  status: string;
  category: string;
  target: string;
  isFree: boolean;
  isNightWeekend: boolean;
  applyUrl: string;
  time?: string;
  fee?: string;
  materialFee?: string;
  tel?: string;
  intro?: string;
}

interface CoursePageProps {
  params: Promise<{ id: string }>;
}

function getAllCourses(): CourseDetail[] {
  try {
    const filePath = path.join(process.cwd(), 'src/data/learning-courses.json');
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      return data.courses || [];
    }
  } catch (e) {
    console.error('Failed to read courses for detail page:', e);
  }
  return [];
}

export async function generateStaticParams() {
  const courses = getAllCourses();
  return courses.map((course) => ({
    id: course.id,
  }));
}

export async function generateMetadata({ params }: CoursePageProps): Promise<Metadata> {
  const { id } = await params;
  const courses = getAllCourses();
  const course = courses.find((c) => c.id === id);

  if (!course) {
    return {
      title: '평생학습 강좌 안내',
    };
  }

  return {
    title: `${course.title} - 수강신청·교육일정·장소 안내 | 의정부 건강·생활 정보 포털`,
    description: `${course.org}(${course.dong})에서 진행되는 ${course.title} 강좌의 교육기간(${course.eduPeriod}), 수강료(${course.fee || '무료'}), 모집인원(${course.capacity}), 주차별 커리큘럼 및 신청 방법입니다.`,
    alternates: {
      canonical: `${SITE_URL}/services/learning/${course.id}`,
    },
    openGraph: {
      title: `${course.title} | 의정부시 평생학습 실시간 강좌`,
      description: `${course.org} · ${course.eduPeriod} · 신청기간: ${course.applyPeriod}`,
      url: `${SITE_URL}/services/learning/${course.id}`,
      type: 'article',
    },
  };
}

export default async function CourseDetailPage({ params }: CoursePageProps) {
  const { id } = await params;
  const courses = getAllCourses();
  const course = courses.find((c) => c.id === id);

  if (!course) {
    notFound();
  }

  // Schema.org W3C Course 구조화 데이터
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.title,
    description: course.intro || `${course.org}에서 진행되는 의정부시 평생학습 강좌`,
    provider: {
      '@type': 'EducationalOrganization',
      name: course.org,
      address: {
        '@type': 'PostalAddress',
        streetAddress: course.address,
        addressLocality: '의정부시',
        addressRegion: '경기도',
        addressCountry: 'KR',
      },
      telephone: course.tel || '031-826-9988',
    },
    offers: {
      '@type': 'Offer',
      price: course.isFree ? '0' : (course.fee?.replace(/[^0-9]/g, '') || '0'),
      priceCurrency: 'KRW',
      category: course.isFree ? 'Free' : 'Paid',
    },
  };

  const kakaoMapUrl = `https://map.kakao.com/link/to/${encodeURIComponent(course.org)},${course.lat},${course.lng}`;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* 구조화 데이터 주입 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ── [구역 1] 헤더 배너 (보상스쿨 Google Blue 테마) ── */}
      <PageHeaderBanner
        badgeTone="sky"
        badgeIcon="book"
        badgeText={`${course.org} · ${course.dong}`}
        title={course.title}
        description={`신청기간 : ${course.applyPeriod} | 교육기간 : ${course.eduPeriod}`}
        watermarkIcon="book"
      >
        <div className="flex flex-wrap gap-2 pt-2">
          <PremiumButton
            href={course.applyUrl}
            isExternal={true}
            variant="primary"
            size="sm"
            icon="external-link"
          >
            공식 사이트에서 바로 신청하기
          </PremiumButton>

          <PremiumButton
            href={kakaoMapUrl}
            isExternal={true}
            variant="secondary"
            size="sm"
            icon="navigation"
          >
            교육장소 길찾기 ({course.org})
          </PremiumButton>

          <PremiumButton
            href="/services/learning"
            variant="outline"
            size="sm"
            icon="list"
          >
            전체 강좌 지도 보기
          </PremiumButton>
        </div>
      </PageHeaderBanner>

      {/* ── [구역 2] 강좌 핵심 요약 팩트 카드 ── */}
      <PremiumCard borderColor="blue" className="p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <HighlightBadge color="emerald">{course.status}</HighlightBadge>
            {course.isFree && <HighlightBadge color="cyan">무료</HighlightBadge>}
            {course.isNightWeekend && <HighlightBadge color="amber">주말·야간</HighlightBadge>}
            <span className="text-xs font-bold text-zinc-500">{course.category}</span>
          </div>
          <span className="text-xs font-mono text-zinc-400">강좌번호 #{course.num}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-none border border-zinc-100 dark:border-zinc-700/60">
            <span className="text-zinc-400 block mb-1">교육기간</span>
            <strong className="text-sm text-zinc-900 dark:text-zinc-100 block">{course.eduPeriod}</strong>
            <span className="text-zinc-500 mt-0.5 block">{course.time || '일정 공지 참조'}</span>
          </div>

          <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-none border border-zinc-100 dark:border-zinc-700/60">
            <span className="text-zinc-400 block mb-1">수강료 및 재료비</span>
            <strong className="text-sm text-[var(--google-blue)] dark:text-[#8ab4f8] block">{course.fee || (course.isFree ? '무료' : '유료')}</strong>
            <span className="text-zinc-500 mt-0.5 block">재료비 : {course.materialFee || '강의계획서 참조'}</span>
          </div>

          <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-none border border-zinc-100 dark:border-zinc-700/60">
            <span className="text-zinc-400 block mb-1">모집인원 및 대상</span>
            <strong className="text-sm text-emerald-600 dark:text-emerald-400 block">{course.capacity}</strong>
            <span className="text-zinc-500 mt-0.5 block">권장 대상 : {course.target}</span>
          </div>

          <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-none border border-zinc-100 dark:border-zinc-700/60">
            <span className="text-zinc-400 block mb-1">인터넷 접수기간</span>
            <strong className="text-sm text-zinc-900 dark:text-zinc-100 block">{course.applyPeriod}</strong>
            <span className="text-zinc-500 mt-0.5 block">선착순 온라인 접수</span>
          </div>

          <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-none border border-zinc-100 dark:border-zinc-700/60">
            <span className="text-zinc-400 block mb-1">교육장소</span>
            <strong className="text-sm text-zinc-900 dark:text-zinc-100 block">{course.org}</strong>
            <span className="text-zinc-500 mt-0.5 block truncate">{course.address}</span>
          </div>

          <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-none border border-zinc-100 dark:border-zinc-700/60">
            <span className="text-zinc-400 block mb-1">문의처</span>
            <strong className="text-sm text-zinc-900 dark:text-zinc-100 block">{course.tel || '031-826-9988'}</strong>
            <span className="text-zinc-500 mt-0.5 block">의정부도시교육재단 평생학습원</span>
          </div>
        </div>
      </PremiumCard>

      {/* ── [구역 3] 상세 교육 소개 & 주차별 커리큘럼 ── */}
      <PremiumCard borderColor="blue" className="p-5 sm:p-7 space-y-4">
        <div className="flex items-center gap-2 border-b border-gray-100 dark:border-zinc-800 pb-3">
          <AppIcon name="book" size={18} className="text-[var(--google-blue)]" />
          <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white">
            상세 교육 소개 및 주차별 강의 계획
          </h3>
        </div>

        {course.intro ? (
          <div className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-line space-y-2 bg-zinc-50/50 dark:bg-zinc-800/30 p-4 border border-zinc-100 dark:border-zinc-800 font-sans">
            {course.intro}
          </div>
        ) : (
          <div className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed space-y-3">
            <p>
              본 강좌는 <strong>{course.org}</strong>에서 진행되는 의정부시 평생학습 정규/수시 특화 프로그램입니다.
              의정부 시민 누구나 참여할 수 있으며, 선착순 인터넷 접수를 통해 등록이 진행됩니다.
            </p>
            <p>
              자세한 주차별 강의계획서 및 준비물 세부 사항은 공식 신청 페이지의 첨부파일(강의계획서.hwp)에서 직접 확인하실 수 있습니다.
            </p>
          </div>
        )}
      </PremiumCard>

      {/* ── [구역 4] 수강료 감면 및 수강 팁 (보상스쿨 W3C 박스) ── */}
      <CommonBox
        title="의정부시 평생학습 수강료 감면 및 신청 안내"
        tone="blue"
        icon={<AppIcon name="shield-check" size={16} />}
      >
        <div className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 space-y-2 leading-relaxed">
          <p>
            • <strong>수강료 50%~100% 감면 혜택</strong> : 기초생활수급자, 국가유공자, 장애인(100% 면제), 다자녀 가정(2자녀 이상), 만 65세 이상 어르신(50% 감면)은 증빙서류 제출 시 감면 혜택을 받으실 수 있습니다.
          </p>
          <p>
            • <strong>마감 시 대기자 등록</strong> : 정원이 조기 마감된 강좌라도 대기 신청을 해두시면 취소자 발생 시 순번에 따라 자동으로 등록 기회가 부여됩니다.
          </p>
          <div className="pt-2">
            <Link
              href="/blog/2026-09-24-uijeongbu-lifelong-learning-enrollment-guide"
              className="inline-flex items-center gap-1 font-bold text-[var(--google-blue)] dark:text-[#8ab4f8] hover:underline"
            >
              <span>2026 수강신청 방법 및 수강료 감면 자격 총정리 가이드 읽기</span>
              <AppIcon name="chevron-right" size={14} />
            </Link>
          </div>
        </div>
      </CommonBox>

      {/* ── [구역 5] 하단 대형 공식 신청 배너 ── */}
      <div className="p-6 bg-gradient-to-r from-blue-900 via-indigo-950 to-zinc-950 text-white rounded-none border border-blue-800 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-blue-300 block mb-1">의정부시 공식 뉴런 플랫폼</span>
          <h4 className="text-base sm:text-lg font-extrabold text-white">
            지금 공식 사이트에서 바로 수강신청을 완료하세요
          </h4>
          <p className="text-xs text-zinc-300 mt-0.5">
            선착순 접수 강좌는 조기 마감될 수 있으니 미리 로그인을 마쳐두시길 권장합니다.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
          <a
            href={course.applyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-6 py-3 bg-[var(--google-blue)] hover:bg-blue-600 text-white text-xs sm:text-sm font-extrabold rounded-none shadow-md inline-flex items-center justify-center gap-2 transition-colors"
          >
            <span>공식 수강신청 바로가기</span>
            <AppIcon name="external-link" size={14} />
          </a>
        </div>
      </div>
    </div>
  );
}
