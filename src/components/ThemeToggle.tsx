"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import AppIcon from "@/components/ui/AppIcon";

const emptySubscribe = () => () => {};

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  const cycleTheme = () => {
    if (theme === "light") {
      setTheme("dark");
    } else if (theme === "dark") {
      setTheme("system");
    } else {
      setTheme("light");
    }
  };

  if (!mounted) {
    return (
      <div className="w-[36px] h-[36px] sm:w-[40px] sm:h-[40px] bg-white dark:bg-[#121417] border border-gray-200 dark:border-zinc-800 animate-pulse rounded-none" />
    );
  }

  return (
    <button
      onClick={cycleTheme}
      className="p-2 text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white transition-colors duration-200 flex items-center justify-center group cursor-pointer border border-gray-200/90 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 bg-white dark:bg-[#202124] hover:bg-zinc-50 dark:hover:bg-zinc-800/80 rounded-none shadow-2xs"
      title={`테마 변경 (현재: ${
        theme === "light" ? "라이트 모드" : theme === "dark" ? "다크 모드" : "시스템 기본값"
      })`}
      aria-label="Toggle theme"
    >
      {/* 라이트 모드 (해 아이콘) */}
      {theme === "light" && (
        <AppIcon name="sun" size={18} strokeWidth={2} className="text-amber-600" />
      )}

      {/* 다크 모드 (달 아이콘) */}
      {theme === "dark" && (
        <AppIcon name="moon" size={18} strokeWidth={2} className="text-sky-400" />
      )}

      {/* 시스템 기본값 (모니터 아이콘) */}
      {theme === "system" && (
        <div className="relative flex items-center justify-center">
          <AppIcon name="monitor" size={18} strokeWidth={2} className="text-zinc-700 dark:text-zinc-300" />
          <span className="absolute -top-1 -right-1 flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
          </span>
        </div>
      )}
    </button>
  );
}
