import { Head, router, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import DeleteConfirmModal from '@/components/common/DeleteConfirmModal';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import AppLayout from '@/layouts/app-layout';

import ManagerDashboard from './components/manager/ManagerDashboard';
import InternDashboard from './internIndex';

interface Props {
    activeSession: any;
    intern?: any;
    registries: any[];
    schedules?: any[];
    absences?: any[];
    becarios?: any[];
    managerRegistries?: any[];
    managerAbsences?: any[];
    role: 'intern' | 'manager';
    centers?: any[];
    allInterns?: any[];
    cycleOptions?: any[];
    filters?: any;
}

const normalizeRegistryStatus = (status?: string | null) => (status === 'late' ? 'late' : 'normal');

const toDateTimeLocalValue = (value: string | null) => {
    if (!value) return '';

    const date = new Date(value);
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    const hours = `${date.getHours()}`.padStart(2, '0');
    const minutes = `${date.getMinutes()}`.padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export default function ControlHorario({
    activeSession,
    intern,
    registries,
    schedules = [],
    absences = [],
    becarios = [],
    managerRegistries = [],
    managerAbsences = [],
    role,
    centers = [],
    allInterns = [],
    cycleOptions = [],
    filters = {},
}: Props) {
    const breadcrumbs = [{ title: 'Control Horario', href: '/control-horario' }];

    const { post: generalPost, patch: generalPatch, processing: generalProcessing } = useForm();
    const [editingRegistry, setEditingRegistry] = useState<any | null>(null);
    const [deletingRegistry, setDeletingRegistry] = useState<any | null>(null);
    const [reviewingAbsence, setReviewingAbsence] = useState<any | null>(null);
    const [elapsedTime, setElapsedTime] = useState('00:00:00');
    const [pdfPeriod, setPdfPeriod] = useState<'weekly' | 'monthly'>('weekly');
    const [pdfDate, setPdfDate] = useState(() => {
        const date = new Date();
        const month = `${date.getMonth() + 1}`.padStart(2, '0');
        const day = `${date.getDate()}`.padStart(2, '0');

        return `${date.getFullYear()}-${month}-${day}`;
    });

    const editForm = useForm({
        check_in: '',
        check_out: '',
        status: 'normal',
        note: '',
    });

    const reviewForm = useForm({
        status: 'approved',
        tutor_comment: '',
    });

    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (activeSession) {
            const calculateElapsed = () => {
                const start = new Date(activeSession.check_in).getTime();
                const now = new Date().getTime();
                const diff = now - start;
                const h = Math.floor(diff / 3600000).toString().padStart(2, '0');
                const m = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
                const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
                setElapsedTime(`${h}:${m}:${s}`);
            };

            calculateElapsed();
            interval = setInterval(calculateElapsed, 1000);
        }

        return () => clearInterval(interval);
    }, [activeSession]);

    const handleCheckIn = () => generalPost('/control-horario/check-in');
    const handleCheckOut = () => {
        if (activeSession) generalPatch(`/control-horario/${activeSession.id}/check-out`);
    };

    const buildPdfUrl = (internId?: string | number) => {
        const params = new URLSearchParams({
            period: pdfPeriod,
            date: pdfDate,
        });

        if (internId) {
            params.set('intern_id', String(internId));
        }

        return `/control-horario/parte-horas/pdf?${params.toString()}`;
    };

    const handlePdfDownload = (internId?: string | number) => {
        window.open(buildPdfUrl(internId), '_blank', 'noopener,noreferrer');
    };

    const openEditRegistry = (registry: any) => {
        setEditingRegistry(registry);
        editForm.setData({
            check_in: toDateTimeLocalValue(registry.check_in),
            check_out: toDateTimeLocalValue(registry.check_out),
            status: normalizeRegistryStatus(registry.status),
            note: registry.note || '',
        });
    };

    const closeEditRegistry = () => {
        setEditingRegistry(null);
        editForm.reset();
    };

    const openReviewAbsence = (absence: any) => {
        setReviewingAbsence(absence);
        reviewForm.setData({
            status: absence.status === 'rejected' ? 'rejected' : 'approved',
            tutor_comment: absence.tutor_comment || '',
        });
    };

    const closeReviewAbsence = () => {
        setReviewingAbsence(null);
        reviewForm.reset();
    };

    const handleConfirmDeleteRegistry = () => {
        if (!deletingRegistry) {
            return;
        }

        router.delete(`/control-horario/${deletingRegistry.id}`, {
            onSuccess: () => toast.success('Fichaje eliminado correctamente'),
            onError: () => toast.error('Error al eliminar el fichaje'),
            onFinish: () => setDeletingRegistry(null),
        });
    };

    const handleEditRegistrySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingRegistry) return;

        editForm.put(`/control-horario/${editingRegistry.id}`, {
            onSuccess: () => {
                closeEditRegistry();
                toast.success('Fichaje actualizado correctamente');
            },
            onError: () => toast.error('Error al actualizar el fichaje'),
        });
    };

    const handleReviewAbsenceSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!reviewingAbsence) return;

        reviewForm.put(`/control-horario/ausencias/${reviewingAbsence.id}`, {
            onSuccess: () => {
                closeReviewAbsence();
                toast.success('Ausencia revisada correctamente');
            },
            onError: () => toast.error('Error al revisar la ausencia'),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Control Horario" />
            <div className="mx-auto w-full max-w-7xl space-y-8 p-6">
                {role === 'manager' && (
                    <ManagerDashboard
                        becarios={becarios}
                        managerRegistries={managerRegistries}
                        managerAbsences={managerAbsences}
                        centers={centers}
                        allInterns={allInterns}
                        cycleOptions={cycleOptions}
                        filters={filters}
                        openEditRegistry={openEditRegistry}
                        openReviewAbsence={openReviewAbsence}
                        setDeletingRegistry={setDeletingRegistry}
                    />
                )}

                {role === 'intern' && (
                    <InternDashboard
                        activeSession={activeSession}
                        registries={registries}
                        schedules={schedules}
                        absences={absences}
                        intern={intern}
                        generalProcessing={generalProcessing}
                        handleCheckIn={handleCheckIn}
                        handleCheckOut={handleCheckOut}
                        elapsedTime={elapsedTime}
                        pdfPeriod={pdfPeriod}
                        setPdfPeriod={setPdfPeriod}
                        pdfDate={pdfDate}
                        setPdfDate={setPdfDate}
                        handlePdfDownload={() => handlePdfDownload()}
                    />
                )}

                <DeleteConfirmModal
                    isOpen={!!deletingRegistry}
                    onClose={() => setDeletingRegistry(null)}
                    onConfirm={handleConfirmDeleteRegistry}
                    title="Eliminar fichaje"
                    itemName={
                        deletingRegistry
                            ? `el fichaje de ${deletingRegistry.intern_name || 'este becario'} del ${new Date(deletingRegistry.check_in).toLocaleDateString('es-ES')}`
                            : undefined
                    }
                />

                <Dialog open={!!editingRegistry} onOpenChange={(open) => !open && closeEditRegistry()}>
                    <DialogContent className="sm:max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Editar fichaje</DialogTitle>
                            <DialogDescription>Ajusta la entrada, salida y observaciones del fichaje seleccionado.</DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleEditRegistrySubmit} className="space-y-6">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">Entrada</label>
                                    <input
                                        type="datetime-local"
                                        required
                                        value={editForm.data.check_in}
                                        onChange={(e) => editForm.setData('check_in', e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">Salida</label>
                                    <input
                                        type="datetime-local"
                                        required
                                        value={editForm.data.check_out}
                                        onChange={(e) => editForm.setData('check_out', e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-[180px_1fr]">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">Estado</label>
                                    <select
                                        value={editForm.data.status}
                                        onChange={(e) => editForm.setData('status', e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                                    >
                                        <option value="normal">Puntual</option>
                                        <option value="late">Retraso</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">Observación</label>
                                    <textarea
                                        value={editForm.data.note}
                                        onChange={(e) => editForm.setData('note', e.target.value)}
                                        rows={4}
                                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                                    />
                                </div>
                            </div>

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={closeEditRegistry}>
                                    Cancelar
                                </Button>
                                <Button type="submit" disabled={editForm.processing}>
                                    {editForm.processing ? 'Guardando...' : 'Guardar cambios'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                <Dialog open={!!reviewingAbsence} onOpenChange={(open) => !open && closeReviewAbsence()}>
                    <DialogContent className="sm:max-w-xl">
                        <DialogHeader>
                            <DialogTitle>Revisar ausencia</DialogTitle>
                            <DialogDescription>Marca la solicitud como aprobada o rechazada y deja una observación para el becario.</DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleReviewAbsenceSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Estado</label>
                                <select
                                    value={reviewForm.data.status}
                                    onChange={(e) => reviewForm.setData('status', e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                                >
                                    <option value="approved">Aprobada</option>
                                    <option value="rejected">Rechazada</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Comentario del tutor</label>
                                <textarea
                                    value={reviewForm.data.tutor_comment}
                                    onChange={(e) => reviewForm.setData('tutor_comment', e.target.value)}
                                    rows={4}
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                                    placeholder="Motivo de la aprobación o rechazo"
                                />
                            </div>

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={closeReviewAbsence}>
                                    Cancelar
                                </Button>
                                <Button type="submit" disabled={reviewForm.processing}>
                                    {reviewForm.processing ? 'Guardando...' : 'Guardar revisión'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
