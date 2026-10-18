import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'destructive';
  dot?: boolean;
}

function Badge({ className, variant = 'default', dot = false, children, ...props }: BadgeProps) {
  const base =
    'inline-flex items-center gap-1.5 rounded-lg px-2 py-0.5 text-xs font-medium transition-colors select-none';

  const variants = {
    default: 'bg-primary text-primary-foreground',
    secondary: 'bg-secondary text-secondary-foreground',
    outline: 'border border-border text-foreground',
    success: 'bg-[#F0FDF4] text-[#016630] border border-[#B9F8CF]',
    warning: 'bg-[#FFFBEB] text-[#953D00] border border-[#FEE685]',
    destructive: 'bg-[#FEF2F2] text-[#BF000F] border border-[#FFCACA]',
  };

  const dotColors = {
    default: 'bg-primary-foreground',
    secondary: 'bg-secondary-foreground',
    outline: 'bg-foreground',
    success: 'bg-[#016630]',
    warning: 'bg-[#953D00]',
    destructive: 'bg-[#BF000F]',
  };

  return (
    <div className={cn(base, variants[variant], className)} {...props}>
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', dotColors[variant])} />}
      {children}
    </div>
  );
}

export { Badge };
