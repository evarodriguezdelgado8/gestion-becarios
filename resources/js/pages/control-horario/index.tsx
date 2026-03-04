import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';

export default function ControlHorario() {
    const breadcrumbs = [{ title: 'Control Horario', href: '/control-horario' }];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Control Horario" />
            <div className="flex flex-1 flex-col gap-4 p-6">
                <div className="border-b pb-4">
                    <h1 className="text-2xl font-bold tracking-tight">Registro de Asistencia</h1>
                    <p className="text-muted-foreground">Control de horas de entrada, salida y permanencia.</p>
                </div>
                <div className="min-h-[400px] rounded-xl border border-dashed flex items-center justify-center bg-muted/50">
                    <p className="text-sm text-muted-foreground italic">El sistema de fichaje se implementará en la Fase 4.</p>
                </div>
            </div>
        </AppLayout>
    );
}