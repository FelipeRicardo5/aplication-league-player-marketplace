import { cn } from '@/lib/utils';

interface BrandLogoProps {
  className?: string;
}

export function BrandLogo({ className = 'h-8 w-8' }: BrandLogoProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('h-8 w-8 shrink-0', className)}
      aria-label="Passe Logo"
    >
      <rect width="32" height="32" rx="8" fill="#155DFC" />
      <path
        d="M11.36 8V24"
        stroke="white"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="16" cy="12.64" r="4.64" stroke="white" strokeWidth="3.2" />
    </svg>
  );
}
