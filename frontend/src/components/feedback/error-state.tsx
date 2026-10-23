import { AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'Não foi possível carregar os dados',
  message = 'Ocorreu uma falha na comunicação com o servidor.',
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        'rounded-2xl border border-red-200 bg-[#FEF2F2]/60 p-12 sm:p-16 shadow-xs flex flex-col items-center justify-center min-h-[360px] sm:min-h-[380px] text-center my-4',
        className,
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-[#BF000F] mb-4 border border-red-200/80">
        <AlertCircle className="h-6 w-6 text-[#BF000F]" />
      </div>
      <h3 className="text-base font-bold text-slate-900 mb-1.5">{title}</h3>
      <p className="text-xs sm:text-sm text-slate-600 max-w-md mb-6 leading-relaxed">{message}</p>
      {onRetry && (
        <Button
          onClick={onRetry}
          variant="outline"
          className="gap-2 border-red-200 bg-white hover:bg-red-50 text-slate-800 text-xs sm:text-sm font-medium h-9 px-4 rounded-lg shadow-xs cursor-pointer"
        >
          <RotateCcw className="h-4 w-4 text-slate-500" />
          Tentar novamente
        </Button>
      )}
    </div>
  );
}
