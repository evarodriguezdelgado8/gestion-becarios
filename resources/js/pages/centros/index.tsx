import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';

export default function Centros() {
    const breadcrumbs = [{ title: 'Centros Educativos', href: '/centros' }];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Centros Educativos" />
            <div className="flex flex-1 flex-col gap-4 p-6">
                <div className="border-b pb-4">
                    <h1 className="text-2xl font-bold tracking-tight">Gestión de Centros Educativos</h1>
                    <p className="text-muted-foreground">Listado y administración de instituciones aliadas.</p>
                </div>
                <div className="min-h-[400px] rounded-xl border border-dashed flex items-center justify-center bg-muted/50">
                    <p className="text-sm text-muted-foreground italic">El listado de centros se implementará en la Fase 3.</p>
                </div>
            </div>
        </AppLayout>
    );
}