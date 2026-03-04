import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';

export default function Evaluacion() {
    const breadcrumbs = [{ title: 'Evaluación y Notas', href: '/evaluacion' }];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Evaluación y Notas" />
            <div className="flex flex-1 flex-col gap-4 p-6">
                <div className="border-b pb-4">
                    <h1 className="text-2xl font-bold tracking-tight">Sistema de Calificaciones</h1>
                    <p className="text-muted-foreground">Evaluación de competencias y resultados finales.</p>
                </div>
                <div className="min-h-[400px] rounded-xl border border-dashed flex items-center justify-center bg-muted/50">
                    <p className="text-sm text-muted-foreground italic">El módulo de evaluación se implementará en la Fase 4.</p>
                </div>
            </div>
        </AppLayout>
    );
}