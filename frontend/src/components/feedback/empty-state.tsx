import React from 'react';
import { Link } from 'react-router-dom';
import { Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  actionIcon?: React.ReactNode;
  onAction?: () => void;
  actionHref?: string;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionIcon,
  onAction,
  actionHref,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-200/80 bg-white p-12 sm:p-16 shadow-xs flex flex-col items-center justify-center min-h-[360px] sm:min-h-[380px] text-center my-4',
        className,
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500 mb-4 border border-slate-200/60">
        {icon || <Inbox className="h-6 w-6" />}
      </div>
      <h3 className="text-base font-bold text-slate-900 mb-1.5">{title}</h3>
      <p className="text-xs sm:text-sm text-slate-500 max-w-md mb-6 leading-relaxed">{description}</p>
      {actionLabel && actionHref && (
        <Button
          asChild
          variant="outline"
          className="gap-2 border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs sm:text-sm font-medium h-9 px-4 shadow-xs cursor-pointer"
        >
          <Link to={actionHref}>
            {actionIcon}
            {actionLabel}
          </Link>
        </Button>
      )}
      {actionLabel && onAction && !actionHref && (
        <Button
          onClick={onAction}
          variant="outline"
          className="gap-2 border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs sm:text-sm font-medium h-9 px-4 shadow-xs cursor-pointer"
        >
          {actionIcon}
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
