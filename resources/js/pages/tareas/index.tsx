import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';

export default function Tareas() {
    const breadcrumbs = [{ title: 'Prácticas y Tareas', href: '/tareas' }];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Prácticas y Tareas" />
            <div className="flex flex-1 flex-col gap-4 p-6">
                <div className="border-b pb-4">
                    <h1 className="text-2xl font-bold tracking-tight">Seguimiento de Tareas</h1>
                    <p className="text-muted-foreground">Control de actividades y planes de prácticas.</p>
                </div>
                <div className="min-h-[400px] rounded-xl border border-dashed flex items-center justify-center bg-muted/50">
                    <p className="text-sm text-muted-foreground italic">La gestión de tareas se implementará en la Fase 4.</p>
                </div>
            </div>
        </AppLayout>
    );
}