'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useKakaoLoader } from 'react-kakao-maps-sdk';
import { useEmergencyData } from '@/hooks/useEmergencyData';
import { getEmergencyItems } from '@/lib/api/emergency';
import EmergencyMap from '@/components/emergency/EmergencyMap';
import EmergencyBottomSheet from '@/components/emergency/EmergencyBottomSheet';
import AppIcon from '@/components/ui/AppIcon';

interface EmergencyMapWidgetProps {
  isWidget?: boolean;
  defaultTab?: 'er' | 'pharmacy';
  hideTabs?: boolean;
}

const neighborhoods = [
  { name: '의정부역(중심)', lat: 37.7380, lng: 127.0450 },
  { name: '민락지구', lat: 37.7454, lng: 127.0984 },
  { name: '신곡/장암', lat: 37.7336, lng: 127.0650 },
  { name: '망월사역', lat: 37.7176, lng: 127.0454 },
  { name: '금오동', lat: 37.7550, lng: 127.0632 },
  { name: '가능/녹양', lat: 37.7540, lng: 127.0300 },
];

export default function EmergencyMapWidget({ isWidget = false, defaultTab = 'er', hideTabs = false }: EmergencyMapWidgetProps) {
  const [mapCenter, setMapCenter] = useState(neighborhoods[0]);
  const { activeTab, setActiveTab, selectedItem, setSelectedItem, currentData } = useEmergencyData(defaultTab);
  const hasPharmacy = getEmergencyItems('pharmacy').length > 0;

  const [loading, error] = useKakaoLoader({
    appkey: "c60e479ca3c78009474b748414de3a1b",
    libraries: ["services", "clusterer"],
  });

  return (
    <div className={`flex flex-col w-full bg-white dark:bg-[#202124] overflow-hidden mt-2 rounded-none shadow-[0_2px_8px_rgba(0,0,0,0.03)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.2)] border border-gray-200/90 dark:border-zinc-800 ${isWidget ? 'h-[500px]' : 'h-[700px] max-h-[80vh]'}`}>
      <header className="bg-white dark:bg-[#202124] z-20 shrink-0 border-b border-gray-200/80 dark:border-zinc-800">
        <div className="p-4 pb-3">
          <div className="flex items-center gap-2">
            {!isWidget && (
              <Link href="/" className="p-1 text-zinc-900 dark:text-zinc-100 hover:opacity-70 transition-opacity">
                <AppIcon name="chevron-left" size={20} strokeWidth={2} />
              </Link>
            )}
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
              <AppIcon name="hospital" size={22} strokeWidth={2} />
              <span>
                {!hasPharmacy
                  ? '응급실 안내'
                  : hideTabs 
                  ? (defaultTab === 'er' ? '응급실 안내' : '심야/휴일 약국')
                  : '병원 & 약국 안내'}
              </span>
            </h1>
          </div>
          
          <div className="flex overflow-x-auto scrollbar-none gap-2 mt-3 pb-1">
            {neighborhoods.map((nb) => (
              <button
                key={nb.name}
                onClick={() => setMapCenter(nb)}
                className={`px-2.5 py-1 text-xs font-bold whitespace-nowrap rounded-none transition-all border ${
                  mapCenter.name === nb.name
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-zinc-900 dark:border-white shadow-xs'
                    : 'bg-zinc-50 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200/80 dark:border-zinc-700 hover:border-zinc-400'
                }`}
              >
                {nb.name}
              </button>
            ))}
          </div>

          {!hideTabs && hasPharmacy && (
            <div className="flex border-b border-gray-200/80 dark:border-zinc-800 mt-3">
              <button
                onClick={() => setActiveTab('er')}
                className={`flex-1 py-2.5 text-xs sm:text-sm font-bold text-center border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
                  activeTab === 'er'
                    ? 'border-zinc-900 dark:border-white text-zinc-900 dark:text-white bg-zinc-50/80 dark:bg-zinc-800/40'
                    : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                <AppIcon name="hospital" size={15} />
                <span>병원 ({currentData.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('pharmacy')}
                className={`flex-1 py-2.5 text-xs sm:text-sm font-bold text-center border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
                  activeTab === 'pharmacy'
                    ? 'border-zinc-900 dark:border-white text-zinc-900 dark:text-white bg-zinc-50/80 dark:bg-zinc-800/40'
                    : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                <AppIcon name="stethoscope" size={15} />
                <span>심야약국 ({currentData.length})</span>
              </button>
            </div>
          )}

          <div className="mt-2.5 pt-2 border-t border-gray-100 dark:border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
            <span>실시간 병상·운영 여부는 아래 공식 사이트에서 확인하세요</span>
            <div className="flex items-center gap-3">
              <a
                href="https://www.e-gen.or.kr/egen/main.do"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white underline underline-offset-2"
              >
                응급의료정보제공(E-GEN)
              </a>
              <span className="text-zinc-300 dark:text-zinc-700">|</span>
              <a
                href="https://www.pharm114.or.kr/main.asp"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white underline underline-offset-2"
              >
                휴일지킴이약국
              </a>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 relative overflow-hidden">
        {loading ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-900 text-zinc-500 gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-zinc-400 border-t-zinc-900 dark:border-t-white animate-spin" />
            <p className="text-xs font-bold">지도를 불러오는 중입니다...</p>
          </div>
        ) : error ? (
          <div className="w-full h-full flex items-center justify-center bg-zinc-50 dark:bg-zinc-900 text-red-500 p-4 text-center text-xs">
            지도를 불러올 수 없습니다. 잠시 후 다시 시도해주세요.
          </div>
        ) : (
          <>
            <EmergencyMap
              mapCenter={mapCenter}
              activeTab={activeTab}
              currentData={currentData}
              setSelectedItem={setSelectedItem}
            />
            <EmergencyBottomSheet
              item={selectedItem}
              activeTab={activeTab}
              onClose={() => setSelectedItem(null)}
            />
          </>
        )}
      </div>
    </div>
  );
}
