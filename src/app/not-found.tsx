import Link from 'next/link';
import AppIcon from '@/components/ui/AppIcon';
import PageHeaderBanner from '@/components/ui/PageHeaderBanner';

export default function NotFound() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16 sm:py-24 text-center">
      {/* 404 헤더 박스 */}
      <PageHeaderBanner
        align="center"
        badgeText="404 Page Not Found"
        badgeTone="amber"
        badgeIcon="warning"
        title="요청하신 페이지를 찾을 수 없습니다"
        description="존재하지 않거나 주소가 변경된 페이지입니다. 아래의 주요 퀵메뉴나 홈으로 이동해 보세요."
        watermarkIcon="warning"
      >
        {/* 4대 주요 퀵링크 그리드 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 border-t border-gray-100 dark:border-zinc-800 text-left">
          <Link
            href="/"
            className="p-3.5 bg-zinc-50/70 dark:bg-zinc-900/60 border border-gray-200/90 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition-all rounded-none shadow-2xs group/card"
          >
            <AppIcon name="home" size={18} strokeWidth={2} className="mb-2 text-zinc-700 dark:text-zinc-300 group-hover/card:text-zinc-950 dark:group-hover/card:text-white" />
            <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">포털 홈</div>
            <div className="text-[11px] text-zinc-500 font-medium">메인 화면</div>
          </Link>

          <Link
            href="/services/emergency"
            className="p-3.5 bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/40 hover:border-emerald-400 dark:hover:border-emerald-600 transition-all rounded-none shadow-2xs group/card"
          >
            <AppIcon name="hospital" size={18} strokeWidth={2} className="mb-2 text-emerald-600 dark:text-emerald-400" />
            <div className="text-xs font-bold text-emerald-950 dark:text-emerald-200">응급실</div>
            <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">응급의료 지도</div>
          </Link>


          <Link
            href="/blog"
            className="p-3.5 bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 hover:border-amber-400 dark:hover:border-amber-600 transition-all rounded-none shadow-2xs group/card"
          >
            <AppIcon name="list" size={18} strokeWidth={2} className="mb-2 text-amber-600 dark:text-amber-400" />
            <div className="text-xs font-bold text-amber-950 dark:text-amber-200">생활 가이드</div>
            <div className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">의료·민원 안내</div>
          </Link>
        </div>
      </PageHeaderBanner>
    </div>
  );
}
