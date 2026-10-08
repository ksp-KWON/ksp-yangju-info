import type { ReactNode } from 'react';
import Link from 'next/link';
import PremiumCard from '@/components/ui/PremiumCard';
import PremiumHeading from '@/components/ui/PremiumHeading';
import AppIcon from '@/components/ui/AppIcon';

interface LegalPageLayoutProps {
  breadcrumbTitle: string;
  pageTitle: string;
  children: ReactNode;
}

export default function LegalPageLayout({
  breadcrumbTitle,
  pageTitle,
  children,
}: LegalPageLayoutProps) {
  return (
    <div className="max-w-4xl mx-auto px-2 sm:px-4 py-8 sm:py-12 space-y-6">
      {/* 브레드크럼 */}
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
          <li className="text-zinc-900 dark:text-white font-bold" aria-current="page">
            {breadcrumbTitle}
          </li>
        </ol>
      </nav>

      <PremiumCard hoverEffect={false} className="p-6 sm:p-10">
        <PremiumHeading level={1} showLeftBorder={false} className="!mb-6 !pb-4 border-b border-gray-100 dark:border-zinc-800">
          {pageTitle}
        </PremiumHeading>
        <div className="text-sm sm:text-[15px] leading-relaxed text-zinc-700 dark:text-zinc-300 space-y-6 font-normal">
          {children}
        </div>
      </PremiumCard>
    </div>
  );
}
