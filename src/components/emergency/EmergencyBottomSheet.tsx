'use client';

import React from 'react';
import { EmergencyItem, TabType } from '@/lib/api/emergency';
import AppIcon from '@/components/ui/AppIcon';
import PremiumButton from '@/components/ui/PremiumButton';

interface BottomSheetProps {
  item: EmergencyItem | null;
  activeTab: TabType;
  onClose: () => void;
}

export default function EmergencyBottomSheet({ item, activeTab, onClose }: BottomSheetProps) {
  if (!item) return null;

  return (
    <div className="absolute z-30 bottom-4 left-4 right-4 max-w-md mx-auto">
      <div className="bg-white dark:bg-[#202124] rounded-none overflow-hidden flex flex-col shadow-2xl border border-gray-200/90 dark:border-zinc-800">
        <div className="bg-zinc-50 dark:bg-zinc-900 px-5 py-3.5 flex justify-between items-center border-b border-gray-200/80 dark:border-zinc-800">
          <div className="flex items-center gap-2 truncate pr-2">
            <AppIcon name={activeTab === 'er' ? 'hospital' : 'stethoscope'} size={18} strokeWidth={2} />
            <h3 className="font-bold text-zinc-900 dark:text-white text-base tracking-tight truncate">
              {item.name}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-none text-zinc-400 hover:text-zinc-700 dark:hover:text-white transition-colors"
          >
            <AppIcon name="close" size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4 text-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 text-xs">
              <AppIcon name="pin" size={14} />
              <span>{item.address}</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-200 font-bold text-xs">
              <AppIcon name="phone" size={14} />
              <a href={`tel:${item.tel}`} className="hover:underline">{item.tel}</a>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <PremiumButton
              href={`tel:${item.tel}`}
              variant="primary"
              size="md"
              fullWidth
              icon="phone"
            >
              전화걸기
            </PremiumButton>
            <PremiumButton
              href={`https://map.kakao.com/link/to/${item.name},${item.lat},${item.lng}`}
              variant="secondary"
              size="md"
              fullWidth
              icon="navigation"
            >
              길찾기
            </PremiumButton>
          </div>
        </div>
      </div>
    </div>
  );
}
