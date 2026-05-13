import { AlertTriangle, ListFilter } from 'lucide-react';

import { Card } from '@/components/ui/card';

export function SummaryCard({
    title,
    value,
    detail,
    valueClass = 'text-slate-900',
}: {
    title: string;
    value: number;
    detail: string;
    valueClass?: string;
}) {
    return (
        <Card className="rounded-3xl border-none bg-white p-5 shadow-sm">
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">{title}</p>
            <p className={`mt-2 text-3xl font-black ${valueClass}`}>{value}</p>
            <p className="mt-1 text-sm font-medium text-slate-500">{detail}</p>
        </Card>
    );
}

export function ManagerHomePanel({
    totalManagerAlerts,
    todayLateRegistries,
    todayMissingAlerts,
    pendingAbsenceRequests,
    todayRegistries,
    dashboardAttentionItems,
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
                        <h3 className="text-lg font-bold text-slate-900">Panel de hoy</h3>
                        <p className="text-sm text-slate-500">Vista global de retrasos, ausencias y fichajes que necesitan atención.</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <span className="rounded-2xl bg-amber-50 px-3 py-2 text-center text-xs font-black text-amber-700">{todayLateRegistries.length} retrasos</span>
                    <span className="rounded-2xl bg-rose-50 px-3 py-2 text-center text-xs font-black text-rose-700">{todayMissingAlerts.length} sin fichaje</span>
                    <span className="rounded-2xl bg-orange-50 px-3 py-2 text-center text-xs font-black text-orange-700">{pendingAbsenceRequests.length} por revisar</span>
                    <span className="rounded-2xl bg-blue-50 px-3 py-2 text-center text-xs font-black text-blue-700">{todayRegistries.length} fichajes hoy</span>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-[1.3fr_0.7fr]">
                <div>
                    <div className="mb-4 flex items-center justify-between">
                        <h4 className="font-bold text-slate-900">Requiere revisión</h4>
                        <span className="text-xs font-bold text-slate-400">{dashboardAttentionItems.length} avisos</span>
                    </div>
                    {dashboardAttentionItems.length === 0 ? (
                        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-8 text-center text-sm font-semibold text-emerald-700">No hay avisos urgentes ahora mismo.</div>
                    ) : (
                        <div className="space-y-3">
                            {dashboardAttentionItems.slice(0, 6).map((item: any) => (
                                <div key={item.id} className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <p className="font-bold text-slate-800">{item.title}</p>
                                        <p className="text-sm font-medium text-slate-500">{item.detail}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`rounded-xl px-2.5 py-1 text-[10px] font-black ${item.badgeClass}`}>{item.badge}</span>
                                        {item.absence && (
                                            <button
                                                type="button"
                                                onClick={() => openReviewAbsence(item.absence)}
                                                className="rounded-xl bg-slate-900 px-3 py-1.5 text-[10px] font-black text-white hover:bg-slate-800"
                                            >
                                                Revisar
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="rounded-3xl border border-slate-100 bg-slate-50/70 p-5">
                    <div className="mb-4 flex items-center gap-2">
                        <ListFilter className="h-4 w-4 text-blue-500" />
                        <h4 className="font-bold text-slate-900">Para entrar al detalle</h4>
                    </div>
                    <p className="text-sm font-medium text-slate-500">Usa los filtros superiores para ver fichajes, editar registros, asignar horarios o exportar partes de horas de un centro, ciclo o becario concreto.</p>
                    <div className="mt-5 space-y-3">
                        {todayRegistries.slice(0, 4).map((registry: any) => (
                            <div key={registry.id} className="rounded-2xl bg-white p-3">
                                <p className="text-sm font-bold text-slate-800">{registry.intern_name || 'Sin asignar'}</p>
                                <p className="text-xs font-medium text-slate-500">
                                    {new Date(registry.check_in).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                    {' · '}
                                    {registry.check_out ? getRegistryHoursLabel(registry) : 'En curso'}
                                </p>
                            </div>
                        ))}
                        {todayRegistries.length === 0 && <div className="rounded-2xl bg-white p-4 text-sm font-semibold text-slate-400">Aún no hay fichajes registrados hoy.</div>}
                    </div>
                </div>
            </div>
        </Card>
    );
}
