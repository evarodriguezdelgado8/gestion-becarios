import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

import { getAbsenceBadgeClass } from './managerUtils';

export default function AbsencesTable({ managerAbsences, openReviewAbsence }: any) {
    return (
        <Card className="overflow-hidden rounded-3xl border-none bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                <div>
                    <h3 className="text-lg font-bold text-slate-900">Solicitudes de ausencia</h3>
                    <p className="text-sm text-slate-500">Revisa las solicitudes de los becarios filtrados y deja una respuesta.</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{managerAbsences.length} solicitudes</span>
            </div>

            {managerAbsences.length === 0 ? (
                <div className="px-6 py-12 text-center text-slate-400">No hay ausencias para los filtros actuales.</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50/80 text-left">
                            <tr>
                                <th className="px-6 py-3 font-bold uppercase tracking-wider text-slate-400">Becario</th>
                                <th className="px-6 py-3 font-bold uppercase tracking-wider text-slate-400">Fecha</th>
                                <th className="px-6 py-3 font-bold uppercase tracking-wider text-slate-400">Motivo</th>
                                <th className="px-6 py-3 font-bold uppercase tracking-wider text-slate-400">Estado</th>
                                <th className="px-6 py-3 font-bold uppercase tracking-wider text-slate-400">Justificante</th>
                                <th className="px-6 py-3 font-bold uppercase tracking-wider text-slate-400">Respuesta tutor</th>
                                <th className="px-6 py-3 text-right font-bold uppercase tracking-wider text-slate-400">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {managerAbsences.map((absence: any) => (
                                <tr key={absence.id} className="hover:bg-slate-50/60">
                                    <td className="px-6 py-4">
                                        <div className="font-semibold text-slate-800">{absence.intern_name || 'Sin asignar'}</div>
                                        <div className="text-xs text-slate-400">{absence.center_name || 'Sin centro'}</div>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-slate-700">{absence.date ? new Date(absence.date).toLocaleDateString('es-ES') : '--'}</td>
                                    <td className="px-6 py-4 text-slate-600">{absence.reason}</td>
                                    <td className="px-6 py-4">
                                        <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${getAbsenceBadgeClass(absence.status)}`}>{absence.status === 'approved' ? 'Aprobada' : absence.status === 'rejected' ? 'Rechazada' : 'Pendiente'}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {absence.attachment_url ? (
                                            <a href={absence.attachment_url} target="_blank" rel="noreferrer" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
                                                Ver archivo
                                            </a>
                                        ) : (
                                            <span className="text-slate-400">Sin archivo</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-slate-500">{absence.tutor_comment || 'Pendiente de revisión'}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-end">
                                            <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={() => openReviewAbsence(absence)}>
                                                Revisar
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </Card>
    );
}
