import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';

export default function Becarios() {
    const breadcrumbs = [{ title: 'Gestión de Becarios', href: '/becarios' }];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Gestión de Becarios" />
            <div className="flex flex-1 flex-col gap-4 p-6">
                <div className="border-b pb-4">
                    <h1 className="text-2xl font-bold tracking-tight">Panel de Becarios</h1>
                    <p className="text-muted-foreground">Control de expedientes y asignaciones de alumnos.</p>
                </div>
                <div className="min-h-[400px] rounded-xl border border-dashed flex items-center justify-center bg-muted/50">
                    <p className="text-sm text-muted-foreground italic">El registro de becarios se implementará en la Fase 3.</p>
                </div>
            </div>
        </AppLayout>
    );
}