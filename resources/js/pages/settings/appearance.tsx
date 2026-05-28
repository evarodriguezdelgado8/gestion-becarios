import { Head } from '@inertiajs/react';
import { Palette } from 'lucide-react';

import AppearanceTabs from '@/components/appearance-tabs';
import { Card } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { edit as editAppearance } from '@/routes/appearance';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Ajustes de apariencia',
        href: editAppearance(),
    },
];

export default function Appearance() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Ajustes de apariencia" />

            <SettingsLayout>
                <Card className="overflow-hidden rounded-3xl border-slate-200 bg-white shadow-sm">
                    <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-5">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                            <Palette className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="font-black text-slate-900">
                                Ajustes de apariencia
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Elige cómo quieres ver la interfaz.
                            </p>
                        </div>
                    </div>

                    <div className="p-6">
                        <AppearanceTabs />
                    </div>
                </Card>
            </SettingsLayout>
        </AppLayout>
    );
}
