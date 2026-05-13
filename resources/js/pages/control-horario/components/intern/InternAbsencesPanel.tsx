import { useForm } from '@inertiajs/react';
import { Clock, FileText, Plus } from 'lucide-react';
import { type FormEvent, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

import { getAbsenceBadgeClass } from './internUtils';

interface InternAbsencesPanelProps {
    absences: any[];
}

export default function InternAbsencesPanel({ absences }: InternAbsencesPanelProps) {
    const [showAbsenceForm, setShowAbsenceForm] = useState(false);
    const absenceForm = useForm({
        date: '',
        reason: '',
        attachment: null as File | null,
    });

    const handleAbsenceSubmit = (event: FormEvent) => {
        event.preventDefault();

        absenceForm.post('/control-horario/ausencias', {
            forceFormData: true,
            onSuccess: () => {
                absenceForm.reset();
                setShowAbsenceForm(false);
            },
        });
    };

    return (
        <Card className="flex flex-col rounded-[32px] border-none bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between px-2">
                <h3 className="flex items-center gap-2 font-bold text-slate-800">
                    <FileText className="h-5 w-5 text-purple-500" /> Mis Ausencias
                </h3>
                <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl border-purple-100 font-bold text-purple-600 hover:bg-purple-50"
                    onClick={() => setShowAbsenceForm((current) => !current)}
                >
                    <Plus className="mr-1 h-4 w-4" /> {showAbsenceForm ? 'Cerrar' : 'Solicitar'}
                </Button>
            </div>

            {showAbsenceForm && (
                <form onSubmit={handleAbsenceSubmit} className="mb-6 space-y-4 rounded-3xl border border-purple-100 bg-purple-50/60 p-5">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-600">Fecha</label>
                            <input
                                type="date"
                                required
                                value={absenceForm.data.date}
                                onChange={(event) => absenceForm.setData('date', event.target.value)}
                                className="w-full rounded-2xl border border-slate-200 text-sm"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-600">Justificante</label>
                            <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={(event) => absenceForm.setData('attachment', event.target.files?.[0] ?? null)}
                                className="w-full rounded-2xl border border-slate-200 bg-white text-sm file:mr-4 file:rounded-xl file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-semibold"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-600">Motivo</label>
                        <textarea
                            required
                            rows={4}
                            value={absenceForm.data.reason}
                            onChange={(event) => absenceForm.setData('reason', event.target.value)}
                            className="w-full rounded-2xl border border-slate-200 text-sm"
                            placeholder="Explica la ausencia y añade contexto si hace falta"
                        />
                    </div>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={absenceForm.processing} className="rounded-2xl bg-purple-600 hover:bg-purple-700">
                            {absenceForm.processing ? 'Enviando...' : 'Enviar solicitud'}
                        </Button>
                    </div>
                </form>
            )}

            <div className="space-y-4">
                {absences.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-400">
                        Todavía no has solicitado ninguna ausencia.
                    </div>
                ) : (
                    absences.map((absence) => (
                        <div key={absence.id} className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 md:flex-row md:items-center md:justify-between">
                            <div className="flex items-center gap-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-100 bg-white text-amber-500 shadow-sm">
                                    <Clock className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-700">{absence.reason}</p>
                                    <p className="text-[10px] font-medium text-slate-400">
                                        {absence.date ? `Fecha solicitada: ${new Date(absence.date).toLocaleDateString('es-ES')}` : 'Sin fecha'}
                                    </p>
                                    {absence.tutor_comment && <p className="mt-1 text-xs text-slate-500">Tutor: {absence.tutor_comment}</p>}
                                    {absence.attachment_url && (
                                        <a href={absence.attachment_url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs font-semibold text-purple-600 hover:text-purple-700">
                                            Ver justificante
                                        </a>
                                    )}
                                </div>
                            </div>
                            <span className={`rounded-lg border px-2 py-1 text-[10px] font-black ${getAbsenceBadgeClass(absence.status)}`}>
                                {absence.status === 'approved' ? 'APROBADA' : absence.status === 'rejected' ? 'RECHAZADA' : 'PENDIENTE'}
                            </span>
                        </div>
                    ))
                )}
            </div>
        </Card>
    );
}
