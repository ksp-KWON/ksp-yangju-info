import React from 'react';
import Link from 'next/link';
import AppIcon, { type AppIconName } from '@/components/ui/AppIcon';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'emerald' | 'amber' | 'kakao' | 'danger';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

export interface PremiumButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: AppIconName;
  iconPosition?: 'left' | 'right';
  href?: string;
  isExternal?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
}

export default function PremiumButton({
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  href,
  isExternal = false,
  fullWidth = false,
  className = '',
  children,
  ...props
}: PremiumButtonProps) {
  const sizeClasses: Record<ButtonSize, string> = {
    xs: 'px-2.5 py-1 text-xs gap-1',
    sm: 'px-3 py-1.5 text-xs font-bold gap-1.5',
    md: 'px-4 py-2 text-xs sm:text-sm font-bold gap-2',
    lg: 'px-6 py-3 text-sm sm:text-base font-bold gap-2.5',
  };

  const variantClasses: Record<ButtonVariant, string> = {
    primary: 'bg-[var(--google-blue)] text-white hover:bg-blue-700 dark:bg-[var(--google-blue)] dark:hover:bg-blue-600 border-[var(--google-blue)] shadow-md hover:shadow-lg hover:shadow-[0_4px_14px_0_rgba(26,115,232,0.39)]',
    secondary: 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 border-zinc-200/90 dark:border-zinc-700 shadow-xs',
    outline: 'bg-white dark:bg-[#202124] text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 border-gray-200/90 dark:border-zinc-700 hover:border-zinc-500 shadow-xs',
    ghost: 'bg-transparent text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 border-transparent',
    emerald: 'bg-[var(--google-green)] text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 border-[var(--google-green)] shadow-md hover:shadow-lg hover:shadow-[0_4px_14px_0_rgba(52,168,83,0.39)]',
    amber: 'bg-[var(--google-yellow)] text-zinc-900 hover:bg-amber-500 dark:bg-amber-500 dark:text-zinc-900 border-[var(--google-yellow)] shadow-xs',
    kakao: 'bg-[#FEE500] hover:bg-[#FADA0A] text-[#191919] border-[#E6CF00] shadow-xs',
    danger: 'bg-[var(--google-red)] text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 border-[var(--google-red)] shadow-md hover:shadow-lg hover:shadow-[0_4px_14px_0_rgba(234,67,53,0.39)]',
  };

  const baseClasses = `inline-flex items-center justify-center font-bold rounded-none border transition-all duration-200 active:scale-[0.98] cursor-pointer ${fullWidth ? 'w-full' : ''} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`;

  const iconElement = icon ? (
    <AppIcon name={icon} size={size === 'xs' ? 12 : size === 'sm' ? 14 : size === 'lg' ? 18 : 15} strokeWidth={2.5} className="shrink-0" />
  ) : null;

  const content = (
    <>
      {icon && iconPosition === 'left' && iconElement}
      <span>{children}</span>
      {icon && iconPosition === 'right' && iconElement}
    </>
  );

  if (href) {
    if (isExternal || href.startsWith('http')) {
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" className={baseClasses}>
          {content}
        </a>
      );
    }
    return (
      <Link href={href} className={baseClasses}>
        {content}
      </Link>
    );
  }

  return (
    <button className={baseClasses} {...props}>
      {content}
    </button>
  );
}
