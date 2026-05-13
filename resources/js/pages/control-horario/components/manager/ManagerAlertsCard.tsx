import { Children, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

import { Card } from '@/components/ui/card';

export default function ManagerAlertsCard({
    totalManagerAlerts,
    todayLateRegistries,
    todayMissingAlerts,
    todayPendingCheckIns,
    pendingAbsenceRequests,
    todayApprovedAbsences,
    lateRegistries,
    getRegistryHoursLabel,
    openReviewAbsence,
}: any) {
    return (
        <Card className="overflow-hidden rounded-3xl border-none bg-white shadow-xl">
            <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-3">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${totalManagerAlerts > 0 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                        <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">Avisos de asistencia</h3>
                        <p className="text-sm text-slate-500">Retrasos, ausencias y fichajes pendientes de los becarios filtrados.</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <span className="rounded-2xl bg-amber-50 px-3 py-2 text-center text-xs font-black text-amber-700">{todayLateRegistries.length} retrasos hoy</span>
                    <span className="rounded-2xl bg-rose-50 px-3 py-2 text-center text-xs font-black text-rose-700">{todayMissingAlerts.length} sin fichaje</span>
                    <span className="rounded-2xl bg-orange-50 px-3 py-2 text-center text-xs font-black text-orange-700">{pendingAbsenceRequests.length} pendientes</span>
                    <span className="rounded-2xl bg-emerald-50 px-3 py-2 text-center text-xs font-black text-emerald-700">{todayApprovedAbsences.length} aprobadas hoy</span>
                </div>
            </div>

            {totalManagerAlerts === 0 ? (
                <div className="px-6 py-6 text-sm font-semibold text-emerald-700">No hay avisos urgentes para los filtros actuales.</div>
            ) : (
                <div className="grid grid-cols-1 gap-4 p-6 lg:grid-cols-3">
                    <AlertColumn title="Retrasos" countLabel={`${lateRegistries.length} total`} emptyText="Sin retrasos registrados." tone="amber">
                        {lateRegistries.slice(0, 3).map((registry: any) => (
                            <div key={registry.id} className="rounded-xl bg-white/80 p-3">
                                <p className="text-sm font-bold text-slate-800">{registry.intern_name || 'Sin asignar'}</p>
                                <p className="text-xs font-medium text-slate-500">
                                    {new Date(registry.check_in).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                    {' · '}
                                    {getRegistryHoursLabel(registry)}
                                </p>
                            </div>
                        ))}
                    </AlertColumn>

                    <AlertColumn title="Ausencias de hoy" countLabel={`${todayMissingAlerts.length + todayPendingCheckIns.length} avisos`} emptyText="No hay ausencias detectadas hoy." tone="rose">
                        {[...todayMissingAlerts, ...todayPendingCheckIns].slice(0, 4).map(({ becario, status }: any) => (
                            <div key={becario.id} className="rounded-xl bg-white/80 p-3">
                                <p className="text-sm font-bold text-slate-800">
                                    {becario.name} {becario.last_name}
                                </p>
                                <p className="text-xs font-medium text-slate-500">{status.detail}</p>
                            </div>
                        ))}
                    </AlertColumn>

                    <AlertColumn title="Solicitudes pendientes" countLabel={`${pendingAbsenceRequests.length} por revisar`} emptyText="No hay solicitudes pendientes." tone="orange">
                        {pendingAbsenceRequests.slice(0, 3).map((absence: any) => (
                            <div key={absence.id} className="rounded-xl bg-white/80 p-3">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-bold text-slate-800">{absence.intern_name || 'Sin asignar'}</p>
                                        <p className="text-xs font-medium text-slate-500">
                                            {absence.date ? new Date(absence.date).toLocaleDateString('es-ES') : 'Sin fecha'} · {absence.reason}
                                        </p>
                                    </div>
                                    <button type="button" onClick={() => openReviewAbsence(absence)} className="rounded-lg bg-orange-100 px-2.5 py-1 text-[10px] font-black text-orange-700 hover:bg-orange-200">
                                        Revisar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </AlertColumn>
                </div>
            )}
        </Card>
    );
}

function AlertColumn({
    title,
    countLabel,
    emptyText,
    tone,
    children,
}: {
    title: string;
    countLabel: string;
    emptyText: string;
    tone: 'amber' | 'rose' | 'orange';
    children: ReactNode;
}) {
    const color = {
        amber: 'border-amber-100 bg-amber-50/50 text-amber-900',
        rose: 'border-rose-100 bg-rose-50/50 text-rose-900',
        orange: 'border-orange-100 bg-orange-50/50 text-orange-900',
    }[tone];
    const countColor = {
        amber: 'text-amber-700',
        rose: 'text-rose-700',
        orange: 'text-orange-700',
    }[tone];

    const hasChildren = Children.count(children) > 0;

    return (
        <div className={`rounded-2xl border p-4 ${color}`}>
            <div className="mb-3 flex items-center justify-between">
                <h4 className="text-sm font-black">{title}</h4>
                <span className={`text-xs font-bold ${countColor}`}>{countLabel}</span>
            </div>
            {!hasChildren ? <p className={`text-sm ${countColor}`}>{emptyText}</p> : <div className="space-y-3">{children}</div>}
        </div>
    );
}
