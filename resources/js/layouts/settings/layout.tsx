import { Link } from '@inertiajs/react';
import { KeyRound, Palette, ShieldCheck, User } from 'lucide-react';
import type { PropsWithChildren } from 'react';

import { Button } from '@/components/ui/button';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn, toUrl } from '@/lib/utils';
import { edit as editAppearance } from '@/routes/appearance';
import { edit } from '@/routes/profile';
import { show } from '@/routes/two-factor';
import { edit as editPassword } from '@/routes/user-password';
import type { NavItem } from '@/types';

const sidebarNavItems: NavItem[] = [
    {
        title: 'Perfil',
        href: toUrl(edit()),
        icon: User,
    },
    {
        title: 'Contraseña',
        href: toUrl(editPassword()),
        icon: KeyRound,
    },
    {
        title: 'Autenticación en dos pasos',
        href: toUrl(show()),
        icon: ShieldCheck,
    },
    {
        title: 'Apariencia',
        href: toUrl(editAppearance()),
        icon: Palette,
    },
];

export default function SettingsLayout({ children }: PropsWithChildren) {
    const { isCurrentOrParentUrl } = useCurrentUrl();

    if (typeof window === 'undefined') {
        return null;
    }

    return (
        <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-8">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                    Configuración
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                    Gestiona tu perfil, seguridad y preferencias visuales.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
                <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
                    <nav className="flex flex-col gap-1" aria-label="Ajustes de cuenta">
                        {sidebarNavItems.map((item, index) => (
                            <Button
                                key={`${item.href}-${index}`}
                                variant="ghost"
                                asChild
                                className={cn(
                                    'h-11 w-full justify-start rounded-2xl px-3 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-950',
                                    {
                                        'bg-blue-50 text-blue-700 hover:bg-blue-50 hover:text-blue-700':
                                            isCurrentOrParentUrl(item.href),
                                    },
                                )}
                            >
                                <Link href={item.href} className="flex items-center gap-2">
                                    {item.icon && (
                                        <item.icon className="h-4 w-4 shrink-0" />
                                    )}
                                    {item.title}
                                </Link>
                            </Button>
                        ))}
                    </nav>
                </aside>

                <section className="min-w-0">{children}</section>
            </div>
        </div>
    );
}
