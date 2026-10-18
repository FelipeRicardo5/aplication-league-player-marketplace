import * as React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'destructive' | 'warning' | 'success';
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    const variants = {
      default: 'bg-[#EFF6FF] border-[#BFDBFE] text-[#1E40AF]',
      destructive: 'bg-[#FEF2F2] border-[#FFCACA] text-[#BF000F] [&>svg]:text-[#BF000F]',
      warning: 'bg-[#FFFBEB] border-[#FEE685] text-[#953D00] [&>svg]:text-[#953D00]',
      success: 'bg-[#F0FDF4] border-[#B9F8CF] text-[#016630] [&>svg]:text-[#016630]',
    };

    const icons = {
      default: <Info className="h-5 w-5 shrink-0" />,
      destructive: <AlertCircle className="h-5 w-5 shrink-0" />,
      warning: <AlertTriangle className="h-5 w-5 shrink-0" />,
      success: <CheckCircle className="h-5 w-5 shrink-0" />,
    };

    return (
      <div
        ref={ref}
        role={variant === 'destructive' ? 'alert' : 'status'}
        className={cn(
          'relative w-full rounded-xl border p-4 flex gap-3 items-start text-sm',
          variants[variant],
          className,
        )}
        {...props}
      >
        {icons[variant]}
        <div className="flex-1 space-y-1">{children}</div>
      </div>
    );
  },
);
Alert.displayName = 'Alert';

const AlertTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h5
      ref={ref}
      className={cn('mb-1 font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  ),
);
AlertTitle.displayName = 'AlertTitle';

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('text-sm opacity-90 [&_p]:leading-relaxed', className)} {...props} />
));
AlertDescription.displayName = 'AlertDescription';

export { Alert, AlertTitle, AlertDescription };
