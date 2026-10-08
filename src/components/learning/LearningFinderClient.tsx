'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Map as KakaoMap, CustomOverlayMap, useKakaoLoader } from 'react-kakao-maps-sdk';
import PageHeaderBanner from '@/components/ui/PageHeaderBanner';
import PremiumCard from '@/components/ui/PremiumCard';
import HighlightBadge from '@/components/ui/HighlightBadge';
import AppIcon from '@/components/ui/AppIcon';

export interface CourseItem {
  id: string;
  num: string;
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
}

interface LearningFinderClientProps {
  initialCourses: CourseItem[];
  updatedAt: string;
}

interface UniquePlace {
  org: string;
  lat: number;
  lng: number;
  count: number;
}

type QuickFilter = 'all' | 'free' | 'night' | 'child' | 'senior';
type DongFilter = 'all' | 'ujb' | 'howon' | 'singok' | 'songsan' | 'heungseon';

const DONG_GROUPS: Record<DongFilter, { label: string; dongs: string[] }> = {
  all: { label: '전체 동', dongs: [] },
  ujb: { label: '의정부1·2동', dongs: ['의정부1동', '의정부2동', '의정부동'] },
  howon: { label: '호원1·2동', dongs: ['호원1동', '호원2동', '호원동'] },
  singok: { label: '신곡·장암동', dongs: ['신곡1동', '신곡2동', '신곡동', '장암동'] },
  songsan: { label: '송산·민락·고산', dongs: ['송산1동', '송산2동', '송산3동', '고산동', '자금동'] },
  heungseon: { label: '흥선·가능·녹양', dongs: ['흥선동', '가능동', '녹양동'] },
};

export default function LearningFinderClient({ initialCourses, updatedAt }: LearningFinderClientProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all');
  const [dongFilter, setDongFilter] = useState<DongFilter>('all');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [selectedPlace, setSelectedPlace] = useState<{ org: string; lat: number; lng: number } | null>(null);

  // 카카오맵 SDK 로더
  const [loading, error] = useKakaoLoader({
    appkey: 'c60e479ca3c78009474b748414de3a1b',
    libraries: ['services', 'clusterer'],
  });

  // 필터링 계산
  const filteredCourses = useMemo(() => {
    return initialCourses.filter((course) => {
      // 1. 검색어
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchTitle = course.title.toLowerCase().includes(term);
        const matchOrg = course.org.toLowerCase().includes(term);
        const matchDong = course.dong.toLowerCase().includes(term);
        const matchCat = course.category.toLowerCase().includes(term);
        if (!matchTitle && !matchOrg && !matchDong && !matchCat) return false;
      }

      // 2. 퀵 필터
      if (quickFilter === 'free' && !course.isFree) return false;
      if (quickFilter === 'night' && !course.isNightWeekend) return false;
      if (quickFilter === 'child' && course.target !== '유아·어린이' && course.target !== '청소년' && !course.title.includes('어린이') && !course.title.includes('초등') && !course.title.includes('창의')) return false;
      if (quickFilter === 'senior' && course.target !== '어르신·50+' && !course.title.includes('시니어') && !course.title.includes('실버')) return false;

      // 3. 동네 필터
      if (dongFilter !== 'all') {
        const allowedDongs = DONG_GROUPS[dongFilter].dongs;
        if (!allowedDongs.includes(course.dong)) return false;
      }

      // 4. 지도 선택 기관 필터
      if (selectedPlace && course.org !== selectedPlace.org) {
        return false;
      }

      return true;
    });
  }, [initialCourses, searchTerm, quickFilter, dongFilter, selectedPlace]);

  // 지도 마커용 고유 거점 목록
  const uniquePlaces = useMemo<UniquePlace[]>(() => {
    const map = new globalThis.Map<string, UniquePlace>();
    for (const c of initialCourses) {
      if (!map.has(c.org)) {
        map.set(c.org, { org: c.org, lat: c.lat, lng: c.lng, count: 1 });
      } else {
        const item = map.get(c.org)!;
        item.count += 1;
      }
    }
    return Array.from(map.values());
  }, [initialCourses]);

  const formattedDate = useMemo(() => {
    if (!updatedAt) return '';
    const d = new Date(updatedAt);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} 기준`;
  }, [updatedAt]);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* 1. 상단 공식 헤더 배너 (보상스쿨 Google Material 스타일) */}
      <PageHeaderBanner
        badgeTone="sky"
        badgeIcon="shield-check"
        badgeText="의정부시 평생학습 통합플랫폼 뉴런 공식 연동"
        title="의정부시 실시간 평생학습 강좌 지도"
        description="도서관·청소년수련관·주민자치센터에서 열리는 지금 신청 가능한 강좌를 1초 만에 검색하고 온라인으로 바로 신청하세요."
        watermarkIcon="book"
      />

      {/* 2. 시정 가이드 포스팅 상호 연계 알림 바 (보상스쿨 W3C 클린 박스) */}
      <div className="p-4 sm:p-5 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/90 dark:border-blue-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-none bg-[var(--google-blue)] text-white flex items-center justify-center shrink-0">
            <AppIcon name="file-text" size={16} strokeWidth={2} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              수강료 최대 50%~100% 감면 대상이신가요?
            </h4>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
              기초수급자, 국가유공자, 다자녀(2자녀 이상), 65세 이상 감면 요건과 신청 팁을 확인하세요.
            </p>
          </div>
        </div>
        <Link
          href="/blog/2026-09-24-uijeongbu-lifelong-learning-enrollment-guide"
          className="inline-flex items-center gap-1 text-xs font-bold text-[var(--google-blue)] dark:text-[#8ab4f8] hover:underline shrink-0"
        >
          <span>2026 수강신청 가이드 보기</span>
          <AppIcon name="chevron-right" size={14} />
        </Link>
      </div>

      {/* 3. 검색 및 퀵 필터 컨트롤 영역 */}
      <div className="bg-white dark:bg-[#202124] border border-gray-200/90 dark:border-zinc-800 p-4 sm:p-6 shadow-xs space-y-4">
        {/* 검색창 */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
            <AppIcon name="search" size={18} />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="강좌명, 교육기관(도서관, 수련관), 또는 배움 키워드를 입력하세요"
            className="w-full pl-10 pr-10 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-800/80 border border-gray-300 dark:border-zinc-700 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-hidden focus:border-[var(--google-blue)] focus:ring-1 focus:ring-[var(--google-blue)]"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-600 cursor-pointer"
            >
              <AppIcon name="close" size={16} />
            </button>
          )}
        </div>

        {/* 보상스쿨 퀵 칩 필터 */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">주요 테마</span>
            {selectedPlace && (
              <button
                onClick={() => setSelectedPlace(null)}
                className="text-xs text-rose-600 dark:text-rose-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>{selectedPlace.org} 선택 해제</span>
                <AppIcon name="close" size={12} />
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'all', label: `전체 (${initialCourses.length})` },
              { id: 'free', label: '무료 강좌' },
              { id: 'night', label: '주말·야간 직장인' },
              { id: 'child', label: '유아·어린이' },
              { id: 'senior', label: '어르신·50+' },
            ].map((chip) => (
              <button
                key={chip.id}
                onClick={() => setQuickFilter(chip.id as QuickFilter)}
                className={`px-3 py-1.5 text-xs font-bold rounded-none transition-all cursor-pointer ${
                  quickFilter === chip.id
                    ? 'bg-[var(--google-blue)] text-white border border-[var(--google-blue)] shadow-xs'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* 동네 선택 탭 */}
        <div className="pt-2 border-t border-gray-100 dark:border-zinc-800 space-y-2">
          <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">권역·동네별</span>
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(DONG_GROUPS) as DongFilter[]).map((key) => (
              <button
                key={key}
                onClick={() => setDongFilter(key)}
                className={`px-2.5 py-1 text-xs font-medium rounded-none transition-colors cursor-pointer ${
                  dongFilter === key
                    ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold'
                    : 'bg-transparent text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                {DONG_GROUPS[key].label}
              </button>
            ))}
          </div>
        </div>

        {/* 뷰 모드 토글 (목록 보기 ⇄ 지도 보기) */}
        <div className="pt-3 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="text-xs text-zinc-500">
            총 <strong className="text-[var(--google-blue)] font-bold">{filteredCourses.length}</strong>개의 실시간 강좌 ({formattedDate})
          </div>
          <div className="inline-flex rounded-none border border-gray-300 dark:border-zinc-700 p-0.5 bg-zinc-100 dark:bg-zinc-800">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-[#202124] text-zinc-900 dark:text-white shadow-2xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
              }`}
            >
              <AppIcon name="list" size={14} />
              <span>목록 보기</span>
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`px-3 py-1 text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'map'
                  ? 'bg-white dark:bg-[#202124] text-zinc-900 dark:text-white shadow-2xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
              }`}
            >
              <AppIcon name="pin" size={14} />
              <span>지도 보기</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. 지도 뷰 모드 */}
      {viewMode === 'map' && (
        <div className="w-full h-[520px] bg-white dark:bg-[#202124] border border-gray-200/90 dark:border-zinc-800 relative overflow-hidden">
          {!loading && !error ? (
            <KakaoMap
              center={selectedPlace ? { lat: selectedPlace.lat, lng: selectedPlace.lng } : { lat: 37.742, lng: 127.065 }}
              style={{ width: '100%', height: '100%' }}
              level={5}
            >
              {uniquePlaces.map((place: UniquePlace) => (
                <CustomOverlayMap key={place.org} position={{ lat: place.lat, lng: place.lng }} yAnchor={1}>
                  <button
                    onClick={() => setSelectedPlace(place)}
                    className={`cursor-pointer px-2.5 py-1 rounded-none shadow-md text-xs font-bold flex items-center gap-1.5 transition-all hover:scale-105 border ${
                      selectedPlace?.org === place.org
                        ? 'bg-[var(--google-blue)] text-white border-[var(--google-blue)]'
                        : 'bg-white dark:bg-[#202124] text-zinc-900 dark:text-white border-blue-400 dark:border-blue-600'
                    }`}
                  >
                    <AppIcon name="book" size={13} className={selectedPlace?.org === place.org ? 'text-white' : 'text-[var(--google-blue)]'} />
                    <span className="max-w-[90px] truncate">{place.org}</span>
                    <span className="px-1 py-0.2 bg-blue-100 dark:bg-blue-900/60 text-[var(--google-blue)] dark:text-blue-200 text-[10px]">
                      {place.count}
                    </span>
                  </button>
                </CustomOverlayMap>
              ))}
            </KakaoMap>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-500">
              지도를 불러오는 중입니다...
            </div>
          )}

          {/* 지도 상단 안내 팁 */}
          <div className="absolute top-3 left-3 z-10 px-3 py-1.5 bg-white/95 dark:bg-[#202124]/95 border border-gray-200 dark:border-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-300 shadow-sm pointer-events-none">
            지도 마커를 클릭하시면 해당 교육장소의 강좌만 모아볼 수 있습니다.
          </div>
        </div>
      )}

      {/* 5. 강좌 카드 목록 뷰 */}
      <div className="space-y-4">
        {filteredCourses.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-[#202124] border border-gray-200/90 dark:border-zinc-800 p-8">
            <AppIcon name="search" size={36} className="mx-auto text-zinc-400 mb-3" />
            <h4 className="text-base font-bold text-zinc-900 dark:text-white">선택하신 조건의 강좌가 없습니다</h4>
            <p className="text-xs text-zinc-500 mt-1">검색어를 변경하거나 필터를 초기화해 보세요.</p>
            <button
              onClick={() => {
                setSearchTerm('');
                setQuickFilter('all');
                setDongFilter('all');
                setSelectedPlace(null);
              }}
              className="mt-4 px-4 py-1.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-bold rounded-none cursor-pointer"
            >
              필터 전체 초기화
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCourses.map((course) => (
              <PremiumCard key={course.id} borderColor="blue" className="p-5 flex flex-col justify-between h-full group/box transition-all">
                <Link href={`/services/learning/${course.id}`} className="block space-y-3 cursor-pointer">
                  {/* 상단 뱃지 라인 */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <HighlightBadge color="emerald">접수중</HighlightBadge>
                      {course.isFree && <HighlightBadge color="cyan">무료</HighlightBadge>}
                      {course.isNightWeekend && <HighlightBadge color="amber">주말·야간</HighlightBadge>}
                      <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                        {course.dong}
                      </span>
                    </div>
                    <span className="text-[11px] text-zinc-400 font-mono">#{course.num}</span>
                  </div>

                  {/* 강좌 제목 (클릭 시 상세페이지 이동) */}
                  <h3 className="text-base font-bold text-[#202124] dark:text-white leading-snug line-clamp-2 group-hover/box:text-[var(--google-blue)] dark:group-hover/box:text-[#8ab4f8] transition-colors">
                    {course.title}
                  </h3>

                  {/* 상세 메타 정보 */}
                  <div className="text-xs space-y-1.5 text-zinc-600 dark:text-zinc-400 pt-1 border-t border-gray-100 dark:border-zinc-800/80">
                    <div className="flex items-center gap-2">
                      <span className="w-14 text-zinc-400 shrink-0">교육기관</span>
                      <strong className="text-zinc-800 dark:text-zinc-200 truncate">{course.org}</strong>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-14 text-zinc-400 shrink-0">교육기간</span>
                      <span className="truncate">{course.eduPeriod}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-14 text-zinc-400 shrink-0">신청기간</span>
                      <span className="truncate">{course.applyPeriod}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-14 text-zinc-400 shrink-0">모집정원</span>
                      <span className="font-bold text-[var(--google-blue)] dark:text-[#8ab4f8]">{course.capacity}</span>
                    </div>
                  </div>
                </Link>

                {/* 하단 2중 액션 버튼: [상세보기 및 커리큘럼] + [바로 신청하기] */}
                <div className="pt-4 mt-3 border-t border-gray-100 dark:border-zinc-800 flex items-center gap-2">
                  <Link
                    href={`/services/learning/${course.id}`}
                    className="flex-1 inline-flex items-center justify-center gap-1 py-2 px-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-bold rounded-none transition-colors"
                  >
                    <AppIcon name="book" size={13} />
                    <span>상세보기</span>
                  </Link>
                  <a
                    href={course.applyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-1 py-2 px-2.5 bg-[var(--google-blue)] hover:bg-[#1557b0] text-white text-xs font-bold rounded-none transition-colors shadow-xs"
                  >
                    <span>공식 신청</span>
                    <AppIcon name="external-link" size={13} />
                  </a>
                </div>
              </PremiumCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
