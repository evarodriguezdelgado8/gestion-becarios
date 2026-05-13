import { ArrowRight, History } from 'lucide-react';
import { useMemo } from 'react';

import { Card } from '@/components/ui/card';

interface InternHistoryTableProps {
    registries: any[];
}

export default function InternHistoryTable({ registries }: InternHistoryTableProps) {
    const chronologicalRegistries = useMemo(
        () => [...registries].sort((a, b) => new Date(b.check_in).getTime() - new Date(a.check_in).getTime()),
        [registries],
    );

    return (
        <Card className="overflow-hidden rounded-[32px] border-none bg-white shadow-xl">
            <div className="flex items-center gap-2 border-b border-slate-50 p-6">
                <History className="h-5 w-5 text-slate-400" />
                <h3 className="font-bold text-slate-800">Historial de Fichajes</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50/50">
                        <tr className="text-left">
                            <th className="px-8 py-4 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">Día</th>
                            <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Horario Realizado</th>
                            <th className="px-8 py-4 text-right text-[10px] font-bold uppercase tracking-widest text-slate-400">Estado</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {chronologicalRegistries.map((registry) => (
                            <tr key={registry.id} className="transition-colors hover:bg-slate-50/30">
                                <td className="px-8 py-5 text-center">
                                    <span className="block font-bold text-slate-700">{new Date(registry.check_in).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
                                    <span className="text-[10px] font-medium uppercase text-slate-400">{new Date(registry.check_in).toLocaleDateString('es-ES', { weekday: 'short' })}</span>
                                </td>
                                <td className="px-8 py-5">
                                    <div className="flex items-center gap-3">
                                        <span className="rounded-xl bg-slate-100 px-3 py-1.5 font-mono text-xs font-bold text-slate-600">
                                            {new Date(registry.check_in).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        <ArrowRight className="h-3 w-3 text-slate-300" />
                                        <span className="rounded-xl bg-slate-100 px-3 py-1.5 font-mono text-xs font-bold text-slate-600">
                                            {registry.check_out ? new Date(registry.check_out).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-8 py-5 text-right">
                                    <span className={`rounded-full border px-3 py-1.5 text-[10px] font-black ${registry.status === 'late' ? 'border-amber-100 bg-amber-50 text-amber-600' : 'border-emerald-100 bg-emerald-50 text-emerald-600'}`}>
                                        {registry.status === 'late' ? 'RETRASO' : 'PUNTUAL'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
}
