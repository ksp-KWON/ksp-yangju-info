'use client';

import { useState } from 'react';
import Link from 'next/link';
import AppIcon from '@/components/ui/AppIcon';

interface Props {
  tags: string[];
}

export default function SidebarTagMore({ tags }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mt-2">
      {isOpen && (
        <div className="flex flex-wrap gap-1.5 text-xs font-bold mb-3 mt-3 animate-in slide-in-from-top-2 fade-in duration-200">
          {tags.map((tag) => (
            <Link
              key={tag}
              href={`/blog?tag=${encodeURIComponent(tag)}`}
              className="flex items-center gap-1 px-2.5 py-1 rounded-none bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-gray-200/80 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition-all text-xs font-medium"
            >
              <span className="text-zinc-400 dark:text-zinc-500">#</span>
              {tag}
            </Link>
          ))}
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center justify-between transition-colors p-2.5 rounded-none bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800/60 dark:hover:bg-zinc-800 border border-gray-200/80 dark:border-zinc-700 cursor-pointer ${
          !isOpen ? 'mt-3' : ''
        }`}
      >
        <div className="flex items-center gap-1.5">
          <AppIcon name="list" size={14} className="text-zinc-700 dark:text-zinc-300" />
          <span>{isOpen ? '태그 접기' : `인기 태그 더보기 (+${tags.length})`}</span>
        </div>
        <AppIcon
          name="chevron-down"
          size={14}
          className={`text-zinc-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
          strokeWidth={2.5}
        />
      </button>
    </div>
  );
}
