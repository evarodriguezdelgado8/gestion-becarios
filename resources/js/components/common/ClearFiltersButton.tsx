import { X } from 'lucide-react';
import type { ButtonHTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

export default function ClearFiltersButton({ className, children = 'Limpiar filtros', type = 'button', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button
            type={type}
            className={cn(
                'flex h-10 items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 text-sm font-bold text-slate-500 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50',
                className,
            )}
            {...props}
        >
            <X className="h-4 w-4" />
            <span>{children}</span>
        </button>
    );
}
