import { useForm } from '@inertiajs/react';
import { Clock, FileText, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import type {FormEvent} from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

import { getAbsenceBadgeClass } from './internUtils';

interface InternAbsencesPanelProps {
    absences: any[];
}

const ABSENCES_PER_PAGE = 6;

export default function InternAbsencesPanel({ absences }: InternAbsencesPanelProps) {
    const [showAbsenceForm, setShowAbsenceForm] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const absenceForm = useForm({
        date: '',
        reason: '',
        attachment: null as File | null,
    });

    const totalPages = Math.max(1, Math.ceil(absences.length / ABSENCES_PER_PAGE));
    const currentSafePage = Math.min(currentPage, totalPages);
    const paginatedAbsences = useMemo(() => {
        const startIndex = (currentSafePage - 1) * ABSENCES_PER_PAGE;

        return absences.slice(startIndex, startIndex + ABSENCES_PER_PAGE);
    }, [absences, currentSafePage]);

    const handleAbsenceSubmit = (event: FormEvent) => {
        event.preventDefault();

        absenceForm.post('/control-horario/ausencias', {
            forceFormData: true,
            onSuccess: () => {
                absenceForm.reset();
                setShowAbsenceForm(false);
                setCurrentPage(1);
                toast.success('Solicitud de ausencia enviada');
            },
            onError: () => toast.error('No se pudo enviar la solicitud de ausencia'),
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
                    <>
                        {paginatedAbsences.map((absence) => (
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
                        ))}

                        {totalPages > 1 && (
                            <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-100 bg-slate-50/70 px-4 py-4 text-sm md:flex-row">
                                <p className="rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-slate-500 shadow-sm ring-1 ring-slate-100">
                                    Página {currentSafePage} de {totalPages}
                                </p>
                                <div className="inline-flex overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                                    <button
                                        type="button"
                                        disabled={currentSafePage === 1}
                                        onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                                        className="cursor-pointer border-r border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        Anterior
                                    </button>
                                    <button
                                        type="button"
                                        disabled={currentSafePage === totalPages}
                                        onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                                        className="cursor-pointer px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        Siguiente
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </Card>
    );
}
