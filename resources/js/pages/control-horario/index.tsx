import { Head, Link, router, useForm } from '@inertiajs/react';
import { AlertTriangle, Calendar as CalendarIcon, Clock, Download, Edit3, FileText, History, ListFilter, Trash2, Users, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import DeleteConfirmModal from '@/components/common/DeleteConfirmModal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { MultiSelect } from '@/components/ui/multi-select';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';

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

interface DaySchedule {
    start: string;
    end: string;
}

interface ScheduleDays {
    [key: string]: DaySchedule;
}

const dateTimeDatePart = (value: string) => value.split('T')[0] || '';
const dateTimeTimePart = (value: string) => value.split('T')[1]?.slice(0, 5) || '';

const mergeDateTimePart = (value: string, part: 'date' | 'time', nextValue: string) => {
    const date = part === 'date' ? nextValue : dateTimeDatePart(value);
    const time = part === 'time' ? nextValue : dateTimeTimePart(value);

    return date || time ? `${date}T${time}` : '';
};

const formatDurationFromHours = (value: number | string | null | undefined) => {
    const hoursValue = Number(value || 0);
    const totalMinutes = Math.round(hoursValue * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours > 0 && minutes > 0) return `${hours} h ${minutes} min`;
    if (hours > 0) return `${hours} h`;

    return `${minutes} min`;
};

const normalizeRegistryStatus = (status?: string | null) => (status === 'late' ? 'late' : 'normal');

const DateTimePickerField = ({
    label,
    value,
    onChange,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
}) => {
    const datePart = dateTimeDatePart(value);
    const timePart = dateTimeTimePart(value);

    return (
        <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wide text-slate-500 ml-1">{label}</label>
            <div className="grid grid-cols-[1fr_112px] gap-2">
                <div className="relative">
                    <CalendarIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                        type="date"
                        required
                        value={datePart}
                        onChange={(e) => onChange(mergeDateTimePart(value, 'date', e.target.value))}
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm font-medium shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                </div>
                <div className="relative">
                    <Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                        type="time"
                        required
                        value={timePart}
                        onChange={(e) => onChange(mergeDateTimePart(value, 'time', e.target.value))}
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm font-medium shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                </div>
            </div>
        </div>
    );
};

export default function ControlHorario({ 
    activeSession, intern, registries, schedules = [], absences = [], becarios = [], managerRegistries = [], managerAbsences = [], role, centers = [], allInterns = [], cycleOptions = [], filters = {} 
}: Props) {
    const breadcrumbs = [{ title: 'Control Horario', href: '/control-horario' }];
    
    const { post: generalPost, patch: generalPatch, processing: generalProcessing } = useForm();
    const [editingRegistry, setEditingRegistry] = useState<any | null>(null);
    const [deletingRegistry, setDeletingRegistry] = useState<any | null>(null);
    const [reviewingAbsence, setReviewingAbsence] = useState<any | null>(null);
    
    const manualForm = useForm({
        user_ids: [] as number[],
        check_in: '',
        check_out: '',
        status: 'normal',
        note: ''
    });

    const editForm = useForm({
        check_in: '',
        check_out: '',
        status: 'normal',
        note: ''
    });

    const reviewForm = useForm({
        status: 'approved',
        tutor_comment: ''
    });

    const scheduleForm = useForm<{user_ids: number[], days: ScheduleDays}>({
        user_ids: [],
        days: {
            '1': { start: '', end: '' },
            '2': { start: '', end: '' },
            '3': { start: '', end: '' },
            '4': { start: '', end: '' },
            '5': { start: '', end: '' },
            '6': { start: '', end: '' },
            '7': { start: '', end: '' },
        }
    });

    const [selectedInterns, setSelectedInterns] = useState(filters.intern_id ? filters.intern_id.split(',') : []);
    const [selectedCenters, setSelectedCenters] = useState(filters.center_id ? filters.center_id.split(',') : []);
    const [selectedCycles, setSelectedCycles] = useState(filters.academic_cycle ? filters.academic_cycle.split(',') : []);
    const [elapsedTime, setElapsedTime] = useState('00:00:00');
    const [currentTime, setCurrentTime] = useState(() => Date.now());
    const [pdfPeriod, setPdfPeriod] = useState<'weekly' | 'monthly'>('weekly');
    const [pdfDate, setPdfDate] = useState(() => {
        const date = new Date();
        const month = `${date.getMonth() + 1}`.padStart(2, '0');
        const day = `${date.getDate()}`.padStart(2, '0');

        return `${date.getFullYear()}-${month}-${day}`;
    });
    const [pdfInternId, setPdfInternId] = useState('');

    const hasActiveFilters = selectedInterns.length > 0 || selectedCenters.length > 0 || selectedCycles.length > 0;
    const eligibleBecarios = becarios.filter((becario: any) => Boolean(becario.user_id));
    const eligibleBecarioUserIds = eligibleBecarios.map((becario: any) => becario.user_id);
    const hasActiveManagerRegistry = managerRegistries.some((registry: any) => !registry.check_out);

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

    useEffect(() => {
        if (!hasActiveManagerRegistry) {
            return;
        }

        setCurrentTime(Date.now());
        const interval = setInterval(() => setCurrentTime(Date.now()), 30000);

        return () => clearInterval(interval);
    }, [hasActiveManagerRegistry]);

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

    const applyFilters = (newFilters: any) => {
        const params: any = {
            intern_id: selectedInterns.join(','),
            center_id: selectedCenters.join(','),
            academic_cycle: selectedCycles.join(','),
            ...newFilters
        };
        Object.keys(params).forEach(key => !params[key] && delete params[key]);
        router.get('/control-horario', params, { preserveState: true, replace: true });
    };

    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (eligibleBecarioUserIds.length === 0) {
            toast.error("No hay becarios con usuario asociado en los filtros actuales");
            return;
        }

        manualForm.transform((data) => ({
            ...data,
            user_ids: eligibleBecarioUserIds
        }));
        manualForm.post('/control-horario/manual', {
            onSuccess: () => { manualForm.reset(); toast.success("Registros creados correctamente"); },
            onError: () => toast.error("Error al crear los registros")
        });
    };

    const handleScheduleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (eligibleBecarioUserIds.length === 0) {
            toast.error("No hay becarios con usuario asociado en los filtros actuales");
            return;
        }

        scheduleForm.transform((data) => ({
            user_ids: eligibleBecarioUserIds,
            schedules: data.days
        }));
        scheduleForm.post('/control-horario/bulk-schedule', {
            onSuccess: () => toast.success("Horarios actualizados correctamente"),
            onError: () => toast.error("Error al actualizar horarios")
        });
    };

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

    const openEditRegistry = (registry: any) => {
        setEditingRegistry(registry);
        editForm.setData({
            check_in: toDateTimeLocalValue(registry.check_in),
            check_out: toDateTimeLocalValue(registry.check_out),
            status: normalizeRegistryStatus(registry.status),
            note: registry.note || ''
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
            tutor_comment: absence.tutor_comment || ''
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
            onSuccess: () => toast.success("Fichaje eliminado correctamente"),
            onError: () => toast.error("Error al eliminar el fichaje"),
            onFinish: () => setDeletingRegistry(null),
        });
    };

    const handleEditRegistrySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingRegistry) return;

        editForm.put(`/control-horario/${editingRegistry.id}`, {
            onSuccess: () => {
                closeEditRegistry();
                toast.success("Fichaje actualizado correctamente");
            },
            onError: () => toast.error("Error al actualizar el fichaje")
        });
    };

    const handleReviewAbsenceSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!reviewingAbsence) return;

        reviewForm.put(`/control-horario/ausencias/${reviewingAbsence.id}`, {
            onSuccess: () => {
                closeReviewAbsence();
                toast.success("Ausencia revisada correctamente");
            },
            onError: () => toast.error("Error al revisar la ausencia")
        });
    };

    const getAbsenceBadgeClass = (status: string) => {
        switch (status) {
            case 'approved':
                return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'rejected':
                return 'bg-rose-50 text-rose-700 border-rose-200';
            default:
                return 'bg-amber-50 text-amber-700 border-amber-200';
        }
    };

    const toDateKey = (date: Date) => {
        const year = date.getFullYear();
        const month = `${date.getMonth() + 1}`.padStart(2, '0');
        const day = `${date.getDate()}`.padStart(2, '0');

        return `${year}-${month}-${day}`;
    };

    const getIsoWeekday = (date: Date) => {
        const day = date.getDay();

        return day === 0 ? 7 : day;
    };

    const getDayStatus = (becario: any) => {
        const today = new Date();
        const todayKey = toDateKey(today);
        const becarioUserId = becario.user_id;
        const todaysRegistries = managerRegistries
            .filter((registry: any) => {
                if (registry.user_id !== becarioUserId) return false;

                const registryDate = new Date(registry.check_in);
                return registryDate.toDateString() === today.toDateString();
            })
            .sort((a: any, b: any) => new Date(b.check_in).getTime() - new Date(a.check_in).getTime());

        const latestRegistry = todaysRegistries[0];
        const todayAbsence = managerAbsences.find((absence: any) => absence.user_id === becarioUserId && absence.date === todayKey);
        const todaySchedule = (becario.schedules || []).find((schedule: any) => schedule.day_of_week === getIsoWeekday(today));

        if (!latestRegistry) {
            if (todayAbsence) {
                if (todayAbsence.status === 'approved') {
                    return {
                        label: 'Ausencia',
                        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                        detail: 'Ausencia aprobada',
                    };
                }

                if (todayAbsence.status === 'rejected') {
                    return {
                        label: 'Rechazada',
                        badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
                        detail: 'Ausencia rechazada',
                    };
                }

                return {
                    label: 'Pendiente',
                    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
                    detail: 'Ausencia pendiente de revisar',
                };
            }

            if (todaySchedule) {
                const plannedStart = new Date(`${todayKey}T${todaySchedule.start_time}`);
                const plannedEnd = new Date(`${todayKey}T${todaySchedule.end_time}`);

                if (today > plannedEnd) {
                    return {
                        label: 'Ausencia',
                        badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
                        detail: `Sin fichaje en horario ${todaySchedule.start_time.slice(0, 5)}-${todaySchedule.end_time.slice(0, 5)}`,
                    };
                }

                if (today >= plannedStart) {
                    return {
                        label: 'Pendiente',
                        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
                        detail: 'Horario iniciado sin fichaje',
                    };
                }

                return {
                    label: 'Programado',
                    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
                    detail: `Empieza a las ${todaySchedule.start_time.slice(0, 5)}`,
                };
            }

            return {
                label: 'Sin fichaje',
                badgeClass: 'bg-slate-100 text-slate-500 border-slate-200',
                detail: 'No hay registro hoy',
            };
        }

        if (!latestRegistry.check_out) {
            return {
                label: 'En curso',
                badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
                detail: `Entrada ${new Date(latestRegistry.check_in).toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit',
                })}`,
            };
        }

        if (latestRegistry.status === 'late') {
            return {
                label: 'Retraso',
                badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
                detail: `${formatDurationFromHours(latestRegistry.total_hours)} trabajadas`,
            };
        }

        return {
            label: 'Completado',
            badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            detail: `${formatDurationFromHours(latestRegistry.total_hours)} trabajadas`,
        };
    };

    const getRegistryHoursLabel = (registry: any) => {
        if (registry.check_out) {
            return registry.total_hours ? formatDurationFromHours(registry.total_hours) : '0 min';
        }

        const checkInTime = new Date(registry.check_in).getTime();
        const elapsedMs = Math.max(0, currentTime - checkInTime);

        return `${formatDurationFromHours(elapsedMs / 3600000)} en curso`;
    };

    const selectedSingleBecario = selectedInterns.length === 1
        ? becarios.find((becario: any) => String(becario.id) === selectedInterns[0])
        : null;
    const managerPdfInternId = selectedSingleBecario?.user_id ? selectedSingleBecario.id : pdfInternId;
    const todayAlertKey = toDateKey(new Date());
    const lateRegistries = managerRegistries.filter((registry: any) => registry.status === 'late');
    const todayLateRegistries = lateRegistries.filter((registry: any) => toDateKey(new Date(registry.check_in)) === todayAlertKey);
    const pendingAbsenceRequests = managerAbsences.filter((absence: any) => absence.status === 'pending');
    const todayApprovedAbsences = managerAbsences.filter((absence: any) => absence.status === 'approved' && absence.date === todayAlertKey);
    const todayMissingAlerts = becarios
        .map((becario: any) => ({
            becario,
            status: getDayStatus(becario),
        }))
        .filter(({ status }: any) => status.label === 'Ausencia' && status.detail.startsWith('Sin fichaje'));
    const todayPendingCheckIns = becarios
        .map((becario: any) => ({
            becario,
            status: getDayStatus(becario),
        }))
        .filter(({ status }: any) => status.label === 'Pendiente' && status.detail === 'Horario iniciado sin fichaje');
    const totalManagerAlerts = todayLateRegistries.length + todayMissingAlerts.length + todayPendingCheckIns.length + pendingAbsenceRequests.length;
    const activeTodayRegistries = managerRegistries.filter((registry: any) => !registry.check_out);
    const todayRegistries = managerRegistries.filter((registry: any) => toDateKey(new Date(registry.check_in)) === todayAlertKey);
    const dashboardAttentionItems = [
        ...todayLateRegistries.map((registry: any) => ({
            id: `late-${registry.id}`,
            title: registry.intern_name || 'Sin asignar',
            detail: `Retraso registrado a las ${new Date(registry.check_in).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`,
            badge: 'Retraso',
            badgeClass: 'bg-amber-50 text-amber-700',
        })),
        ...todayMissingAlerts.map(({ becario, status }: any) => ({
            id: `missing-${becario.id}`,
            title: `${becario.name} ${becario.last_name}`,
            detail: status.detail,
            badge: 'Sin fichaje',
            badgeClass: 'bg-rose-50 text-rose-700',
        })),
        ...todayPendingCheckIns.map(({ becario, status }: any) => ({
            id: `pending-check-${becario.id}`,
            title: `${becario.name} ${becario.last_name}`,
            detail: status.detail,
            badge: 'Pendiente',
            badgeClass: 'bg-orange-50 text-orange-700',
        })),
        ...pendingAbsenceRequests.map((absence: any) => ({
            id: `absence-${absence.id}`,
            title: absence.intern_name || 'Sin asignar',
            detail: `${absence.date ? new Date(absence.date).toLocaleDateString('es-ES') : 'Sin fecha'} · ${absence.reason}`,
            badge: 'Ausencia',
            badgeClass: 'bg-orange-50 text-orange-700',
            absence,
        })),
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Control Horario" />
            <div className="p-6 max-w-7xl mx-auto w-full space-y-8">
                
                {/* --- VISTA MANAGER --- */}
                {role === 'manager' && (
                    <>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Control de asistencia</h1>
                            </div>
                            {hasActiveFilters && (
                                <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-2xl border border-blue-100 shadow-sm text-blue-700 font-bold text-sm">
                                    <Users className="w-4 h-4" /> {becarios.length} Seleccionados
                                </div>
                            )}
                        </div>

                        <Card className="p-5 border-none shadow-xl bg-white rounded-3xl">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold uppercase text-slate-400 ml-1">Becario</label>
                                    <MultiSelect options={allInterns.map(i => ({ label: `${i.name} ${i.last_name}`, value: i.id.toString() }))} selected={selectedInterns} onChange={(v) => { setSelectedInterns(v); applyFilters({ intern_id: v.join(',') }); }} placeholder="Buscar becarios..." />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold uppercase text-slate-400 ml-1">Centro</label>
                                    <MultiSelect options={centers.map(c => ({ label: c.name, value: c.id.toString() }))} selected={selectedCenters} onChange={(v) => { setSelectedCenters(v); applyFilters({ center_id: v.join(',') }); }} placeholder="Todos los centros" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold uppercase text-slate-400 ml-1">Ciclo</label>
                                    <MultiSelect options={cycleOptions} selected={selectedCycles} onChange={(v) => { setSelectedCycles(v); applyFilters({ academic_cycle: v.join(',') }); }} placeholder="Cualquier ciclo" />
                                </div>
                                <Button variant="ghost" onClick={() => router.get('/control-horario')} className="text-slate-400 hover:text-red-500 rounded-xl h-10">
                                    <X className="w-4 h-4 mr-2" /> Limpiar filtros
                                </Button>
                            </div>
                        </Card>

                        {!hasActiveFilters ? (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                                    <Card className="border-none bg-white p-5 shadow-sm rounded-3xl">
                                        <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Becarios</p>
                                        <p className="mt-2 text-3xl font-black text-slate-900">{becarios.length}</p>
                                        <p className="mt-1 text-sm font-medium text-slate-500">Con seguimiento en el sistema</p>
                                    </Card>
                                    <Card className="border-none bg-white p-5 shadow-sm rounded-3xl">
                                        <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">En curso</p>
                                        <p className="mt-2 text-3xl font-black text-blue-600">{activeTodayRegistries.length}</p>
                                        <p className="mt-1 text-sm font-medium text-slate-500">Fichajes activos ahora</p>
                                    </Card>
                                    <Card className="border-none bg-white p-5 shadow-sm rounded-3xl">
                                        <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Retrasos hoy</p>
                                        <p className="mt-2 text-3xl font-black text-amber-600">{todayLateRegistries.length}</p>
                                        <p className="mt-1 text-sm font-medium text-slate-500">Entradas fuera del margen</p>
                                    </Card>
                                    <Card className="border-none bg-white p-5 shadow-sm rounded-3xl">
                                        <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Ausencias</p>
                                        <p className="mt-2 text-3xl font-black text-orange-600">{pendingAbsenceRequests.length}</p>
                                        <p className="mt-1 text-sm font-medium text-slate-500">Solicitudes pendientes</p>
                                    </Card>
                                </div>

                                <Card className="overflow-hidden border-none bg-white shadow-xl rounded-3xl">
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
                                            <span className="rounded-2xl bg-amber-50 px-3 py-2 text-center text-xs font-black text-amber-700">
                                                {todayLateRegistries.length} retrasos
                                            </span>
                                            <span className="rounded-2xl bg-rose-50 px-3 py-2 text-center text-xs font-black text-rose-700">
                                                {todayMissingAlerts.length} sin fichaje
                                            </span>
                                            <span className="rounded-2xl bg-orange-50 px-3 py-2 text-center text-xs font-black text-orange-700">
                                                {pendingAbsenceRequests.length} por revisar
                                            </span>
                                            <span className="rounded-2xl bg-blue-50 px-3 py-2 text-center text-xs font-black text-blue-700">
                                                {todayRegistries.length} fichajes hoy
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-[1.3fr_0.7fr]">
                                        <div>
                                            <div className="mb-4 flex items-center justify-between">
                                                <h4 className="font-bold text-slate-900">Requiere revisión</h4>
                                                <span className="text-xs font-bold text-slate-400">{dashboardAttentionItems.length} avisos</span>
                                            </div>
                                            {dashboardAttentionItems.length === 0 ? (
                                                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-8 text-center text-sm font-semibold text-emerald-700">
                                                    No hay avisos urgentes ahora mismo.
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    {dashboardAttentionItems.slice(0, 6).map((item: any) => (
                                                        <div key={item.id} className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 sm:flex-row sm:items-center sm:justify-between">
                                                            <div>
                                                                <p className="font-bold text-slate-800">{item.title}</p>
                                                                <p className="text-sm font-medium text-slate-500">{item.detail}</p>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className={`rounded-xl px-2.5 py-1 text-[10px] font-black ${item.badgeClass}`}>
                                                                    {item.badge}
                                                                </span>
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
                                            <p className="text-sm font-medium text-slate-500">
                                                Usa los filtros superiores para ver fichajes, editar registros, asignar horarios o exportar partes de horas de un centro, ciclo o becario concreto.
                                            </p>
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
                                                {todayRegistries.length === 0 && (
                                                    <div className="rounded-2xl bg-white p-4 text-sm font-semibold text-slate-400">
                                                        Aún no hay fichajes registrados hoy.
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <Card className="border-none bg-white p-5 shadow-xl rounded-3xl">
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_180px_180px_auto] md:items-end">
                                        <div>
                                            <h3 className="font-bold text-slate-900">Exportar parte de horas</h3>
                                            <p className="text-sm text-slate-500">Descarga el parte semanal o mensual del becario seleccionado.</p>
                                        </div>
                                        {!selectedSingleBecario?.user_id && (
                                            <div className="space-y-1.5">
                                                <label className="text-[11px] font-bold uppercase text-slate-400 ml-1">Becario</label>
                                                <select
                                                    value={pdfInternId}
                                                    onChange={(e) => setPdfInternId(e.target.value)}
                                                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
                                                >
                                                    <option value="">Seleccionar</option>
                                                    {becarios
                                                        .filter((becario: any) => becario.user_id)
                                                        .map((becario: any) => (
                                                            <option key={becario.id} value={becario.id}>
                                                                {becario.name} {becario.last_name}
                                                            </option>
                                                        ))}
                                                </select>
                                            </div>
                                        )}
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-bold uppercase text-slate-400 ml-1">Periodo</label>
                                            <select
                                                value={pdfPeriod}
                                                onChange={(e) => setPdfPeriod(e.target.value as 'weekly' | 'monthly')}
                                                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
                                            >
                                                <option value="weekly">Semanal</option>
                                                <option value="monthly">Mensual</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-bold uppercase text-slate-400 ml-1">Fecha base</label>
                                            <input
                                                type="date"
                                                value={pdfDate}
                                                onChange={(e) => setPdfDate(e.target.value)}
                                                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
                                            />
                                        </div>
                                        <Button
                                            type="button"
                                            disabled={!managerPdfInternId}
                                            onClick={() => handlePdfDownload(managerPdfInternId)}
                                            className="h-10 rounded-xl bg-slate-900 font-bold text-white hover:bg-slate-800"
                                        >
                                            <Download className="mr-2 h-4 w-4" /> PDF
                                        </Button>
                                    </div>
                                </Card>

                                <Card className="overflow-hidden border-none bg-white shadow-xl rounded-3xl">
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
                                            <span className="rounded-2xl bg-amber-50 px-3 py-2 text-center text-xs font-black text-amber-700">
                                                {todayLateRegistries.length} retrasos hoy
                                            </span>
                                            <span className="rounded-2xl bg-rose-50 px-3 py-2 text-center text-xs font-black text-rose-700">
                                                {todayMissingAlerts.length} sin fichaje
                                            </span>
                                            <span className="rounded-2xl bg-orange-50 px-3 py-2 text-center text-xs font-black text-orange-700">
                                                {pendingAbsenceRequests.length} pendientes
                                            </span>
                                            <span className="rounded-2xl bg-emerald-50 px-3 py-2 text-center text-xs font-black text-emerald-700">
                                                {todayApprovedAbsences.length} aprobadas hoy
                                            </span>
                                        </div>
                                    </div>

                                    {totalManagerAlerts === 0 ? (
                                        <div className="px-6 py-6 text-sm font-semibold text-emerald-700">
                                            No hay avisos urgentes para los filtros actuales.
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 gap-4 p-6 lg:grid-cols-3">
                                            <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-4">
                                                <div className="mb-3 flex items-center justify-between">
                                                    <h4 className="text-sm font-black text-amber-900">Retrasos</h4>
                                                    <span className="text-xs font-bold text-amber-700">{lateRegistries.length} total</span>
                                                </div>
                                                {lateRegistries.length === 0 ? (
                                                    <p className="text-sm text-amber-700">Sin retrasos registrados.</p>
                                                ) : (
                                                    <div className="space-y-3">
                                                        {lateRegistries.slice(0, 3).map((registry: any) => (
                                                            <div key={registry.id} className="rounded-xl bg-white/80 p-3">
                                                                <p className="text-sm font-bold text-slate-800">{registry.intern_name || 'Sin asignar'}</p>
                                                                <p className="text-xs font-medium text-slate-500">
                                                                    {new Date(registry.check_in).toLocaleString('es-ES', {
                                                                        day: '2-digit',
                                                                        month: '2-digit',
                                                                        hour: '2-digit',
                                                                        minute: '2-digit',
                                                                    })}
                                                                    {' · '}
                                                                    {getRegistryHoursLabel(registry)}
                                                                </p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-4">
                                                <div className="mb-3 flex items-center justify-between">
                                                    <h4 className="text-sm font-black text-rose-900">Ausencias de hoy</h4>
                                                    <span className="text-xs font-bold text-rose-700">{todayMissingAlerts.length + todayPendingCheckIns.length} avisos</span>
                                                </div>
                                                {todayMissingAlerts.length === 0 && todayPendingCheckIns.length === 0 ? (
                                                    <p className="text-sm text-rose-700">No hay ausencias detectadas hoy.</p>
                                                ) : (
                                                    <div className="space-y-3">
                                                        {[...todayMissingAlerts, ...todayPendingCheckIns].slice(0, 4).map(({ becario, status }: any) => (
                                                            <div key={becario.id} className="rounded-xl bg-white/80 p-3">
                                                                <p className="text-sm font-bold text-slate-800">{becario.name} {becario.last_name}</p>
                                                                <p className="text-xs font-medium text-slate-500">{status.detail}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="rounded-2xl border border-orange-100 bg-orange-50/50 p-4">
                                                <div className="mb-3 flex items-center justify-between">
                                                    <h4 className="text-sm font-black text-orange-900">Solicitudes pendientes</h4>
                                                    <span className="text-xs font-bold text-orange-700">{pendingAbsenceRequests.length} por revisar</span>
                                                </div>
                                                {pendingAbsenceRequests.length === 0 ? (
                                                    <p className="text-sm text-orange-700">No hay solicitudes pendientes.</p>
                                                ) : (
                                                    <div className="space-y-3">
                                                        {pendingAbsenceRequests.slice(0, 3).map((absence: any) => (
                                                            <div key={absence.id} className="rounded-xl bg-white/80 p-3">
                                                                <div className="flex items-start justify-between gap-3">
                                                                    <div>
                                                                        <p className="text-sm font-bold text-slate-800">{absence.intern_name || 'Sin asignar'}</p>
                                                                        <p className="text-xs font-medium text-slate-500">
                                                                            {absence.date ? new Date(absence.date).toLocaleDateString('es-ES') : 'Sin fecha'} · {absence.reason}
                                                                        </p>
                                                                    </div>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => openReviewAbsence(absence)}
                                                                        className="rounded-lg bg-orange-100 px-2.5 py-1 text-[10px] font-black text-orange-700 hover:bg-orange-200"
                                                                    >
                                                                        Revisar
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </Card>

                                <Tabs defaultValue="asistencia" className="w-full space-y-6">
                                <TabsList className="bg-slate-100 p-1.5 rounded-2xl w-full md:w-auto grid grid-cols-4 md:inline-flex h-auto">
                                    <TabsTrigger value="asistencia" className="rounded-xl py-2 px-6 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                        <History className="w-4 h-4 mr-2" /> Asistencias
                                    </TabsTrigger>
                                    <TabsTrigger value="manual" className="rounded-xl py-2 px-6 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                        <Edit3 className="w-4 h-4 mr-2" /> Registro Manual
                                    </TabsTrigger>
                                    <TabsTrigger value="horario" className="rounded-xl py-2 px-6 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                        <CalendarIcon className="w-4 h-4 mr-2" /> Horarios
                                    </TabsTrigger>
                                    <TabsTrigger value="ausencias" className="rounded-xl py-2 px-6 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                        <FileText className="w-4 h-4 mr-2" /> Ausencias
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="asistencia" className="animate-in fade-in duration-300 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {becarios.map((becario: any) => (
                                            <Link key={becario.id} href={`/becarios/${becario.id}`} className="block rounded-3xl focus:outline-none focus:ring-2 focus:ring-blue-200">
                                                <Card className="h-full p-5 border-none shadow-sm bg-white rounded-3xl group hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer">
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center font-bold text-slate-500 border border-slate-200 capitalize group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                                            {becario.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-slate-900 leading-tight group-hover:text-blue-700 transition-colors">{becario.name} {becario.last_name}</h4>
                                                            <p className="text-xs text-slate-400 mt-1">{becario.center?.name || 'Sin centro'}</p>
                                                        </div>
                                                    </div>
                                                    {(() => {
                                                        const dayStatus = getDayStatus(becario);

                                                        return (
                                                            <>
                                                                <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center">
                                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hoy</span>
                                                                    <span className={`text-[10px] font-black px-2 py-1 rounded-lg border ${dayStatus.badgeClass}`}>{dayStatus.label}</span>
                                                                </div>
                                                                <p className="mt-3 text-sm font-medium text-slate-500">{dayStatus.detail}</p>
                                                            </>
                                                        );
                                                    })()}
                                                </Card>
                                            </Link>
                                        ))}
                                    </div>

                                    <Card className="overflow-hidden border-none shadow-xl bg-white rounded-3xl">
                                        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-900">Fichajes registrados</h3>
                                                <p className="text-sm text-slate-500">Edita o elimina cualquier fichaje de los becarios filtrados.</p>
                                            </div>
                                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                                                {managerRegistries.length} registros
                                            </span>
                                        </div>

                                        {managerRegistries.length === 0 ? (
                                            <div className="px-6 py-12 text-center text-slate-400">
                                                No hay fichajes para los filtros actuales.
                                            </div>
                                        ) : (
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-sm">
                                                    <thead className="bg-slate-50/80 text-left">
                                                        <tr>
                                                            <th className="px-6 py-3 font-bold uppercase tracking-wider text-slate-400">Becario</th>
                                                            <th className="px-6 py-3 font-bold uppercase tracking-wider text-slate-400">Entrada</th>
                                                            <th className="px-6 py-3 font-bold uppercase tracking-wider text-slate-400">Salida</th>
                                                            <th className="px-6 py-3 font-bold uppercase tracking-wider text-slate-400">Horas</th>
                                                            <th className="px-6 py-3 font-bold uppercase tracking-wider text-slate-400">Tipo</th>
                                                            <th className="px-6 py-3 font-bold uppercase tracking-wider text-slate-400">Estado</th>
                                                            <th className="px-6 py-3 font-bold uppercase tracking-wider text-slate-400">Observación</th>
                                                            <th className="px-6 py-3 text-right font-bold uppercase tracking-wider text-slate-400">Acciones</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100">
                                                        {managerRegistries.map((registry: any) => (
                                                            <tr key={registry.id} className="hover:bg-slate-50/60">
                                                                <td className="px-6 py-4">
                                                                    <div className="font-semibold text-slate-800">{registry.intern_name || 'Sin asignar'}</div>
                                                                    <div className="text-xs text-slate-400">{registry.center_name || 'Sin centro'}</div>
                                                                </td>
                                                                <td className="px-6 py-4 font-mono text-slate-700">
                                                                    {new Date(registry.check_in).toLocaleString('es-ES', {
                                                                        day: '2-digit',
                                                                        month: '2-digit',
                                                                        year: 'numeric',
                                                                        hour: '2-digit',
                                                                        minute: '2-digit',
                                                                    })}
                                                                </td>
                                                                <td className="px-6 py-4 font-mono text-slate-700">
                                                                    {registry.check_out
                                                                        ? new Date(registry.check_out).toLocaleString('es-ES', {
                                                                              day: '2-digit',
                                                                              month: '2-digit',
                                                                              year: 'numeric',
                                                                              hour: '2-digit',
                                                                              minute: '2-digit',
                                                                          })
                                                                        : 'Activa'}
                                                                </td>
                                                                <td className="px-6 py-4 font-semibold text-slate-700">
                                                                    {getRegistryHoursLabel(registry)}
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${registry.type === 'manual' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                                                                        {registry.type === 'manual' ? 'Manual' : 'Automático'}
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${registry.status === 'late' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
                                                                        {registry.status === 'late' ? 'Retraso' : 'Puntual'}
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-4 text-slate-500">
                                                                    {registry.note || 'Sin observaciones'}
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <div className="flex justify-end gap-2">
                                                                        <Button
                                                                            type="button"
                                                                            variant="outline"
                                                                            size="icon"
                                                                            className="h-8 w-8 rounded-xl"
                                                                            onClick={() => openEditRegistry(registry)}
                                                                            title="Editar fichaje"
                                                                            aria-label="Editar fichaje"
                                                                        >
                                                                            <Edit3 className="h-3.5 w-3.5" />
                                                                        </Button>
                                                                        <Button
                                                                            type="button"
                                                                            variant="destructive"
                                                                            size="icon"
                                                                            className="h-8 w-8 rounded-xl"
                                                                            onClick={() => setDeletingRegistry(registry)}
                                                                            title="Eliminar fichaje"
                                                                            aria-label="Eliminar fichaje"
                                                                        >
                                                                            <Trash2 className="h-3.5 w-3.5" />
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
                                </TabsContent>

                                <TabsContent value="manual" className="animate-in fade-in duration-300">
                                    <Card className="overflow-hidden border-none bg-white shadow-xl rounded-3xl">
                                        <div className="border-b border-slate-100 bg-gradient-to-r from-sky-50 via-white to-emerald-50 p-6">
                                            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-600 text-white shadow-lg shadow-sky-100">
                                                        <Edit3 className="h-6 w-6" />
                                                    </div>
                                                    <div>
                                                        <h2 className="text-xl font-black text-slate-900">Añadir registro manual</h2>
                                                        <p className="text-sm text-slate-500">Completa una jornada para los becarios filtrados</p>
                                                    </div>
                                                </div>
                                                <span className="w-fit rounded-full border border-sky-100 bg-white px-4 py-2 text-xs font-black uppercase tracking-wide text-sky-700 shadow-sm">
                                                    {eligibleBecarios.length} becarios afectados
                                                </span>
                                            </div>
                                        </div>
                                        <form onSubmit={handleManualSubmit} className="p-6 space-y-6">
                                            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                                                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                                                    <DateTimePickerField
                                                        label="Entrada"
                                                        value={manualForm.data.check_in}
                                                        onChange={(value) => manualForm.setData('check_in', value)}
                                                    />
                                                </div>
                                                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                                                    <DateTimePickerField
                                                        label="Salida"
                                                        value={manualForm.data.check_out}
                                                        onChange={(value) => manualForm.setData('check_out', value)}
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_180px_260px]">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold uppercase tracking-wide text-slate-500 ml-1">Observación</label>
                                                    <textarea
                                                        value={manualForm.data.note}
                                                        className="min-h-[122px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                                                        placeholder="Ej: Olvido de fichaje, salida registrada por tutor..."
                                                        onChange={e => manualForm.setData('note', e.target.value)}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold uppercase tracking-wide text-slate-500 ml-1">Estado</label>
                                                    <select
                                                        value={manualForm.data.status}
                                                        onChange={(e) => manualForm.setData('status', e.target.value)}
                                                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                                                    >
                                                        <option value="normal">Puntual</option>
                                                        <option value="late">Retraso</option>
                                                    </select>
                                                </div>
                                                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                                                    <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Resumen</p>
                                                    <p className="mt-3 text-sm font-medium text-emerald-900">
                                                        Se creará un fichaje manual para los becarios con usuario asociado incluidos en los filtros actuales.
                                                    </p>
                                                    <p className="mt-3 text-xs text-emerald-700">
                                                        El total de horas se calcula automáticamente al guardar.
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex justify-end">
                                                <Button disabled={manualForm.processing || eligibleBecarioUserIds.length === 0} className="h-12 rounded-2xl bg-sky-600 px-8 font-bold text-white shadow-lg shadow-sky-100 hover:bg-sky-700">
                                                    {manualForm.processing ? 'Guardando...' : 'Registrar jornada'}
                                                </Button>
                                            </div>
                                        </form>
                                    </Card>
                                </TabsContent>

                                <TabsContent value="horario" className="animate-in fade-in duration-300">
                                    <Card className="overflow-hidden border-none bg-white shadow-xl rounded-3xl">
                                        <div className="border-b border-slate-100 bg-gradient-to-r from-violet-50 via-white to-amber-50 p-6">
                                            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-lg shadow-violet-100">
                                                        <CalendarIcon className="h-6 w-6" />
                                                    </div>
                                                    <div>
                                                        <h2 className="text-xl font-black text-slate-900">Horario semanal</h2>
                                                        <p className="text-sm text-slate-500">Define la jornada de referencia para detectar retrasos y ausencias.</p>
                                                    </div>
                                                </div>
                                                <span className="w-fit rounded-full border border-violet-100 bg-white px-4 py-2 text-xs font-black uppercase tracking-wide text-violet-700 shadow-sm">
                                                    {eligibleBecarios.length} becarios seleccionados
                                                </span>
                                            </div>
                                        </div>
                                        <form onSubmit={handleScheduleSubmit} className="p-6 space-y-4">
                                            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                                            {Object.entries({ '1': 'Lunes', '2': 'Martes', '3': 'Miércoles', '4': 'Jueves', '5': 'Viernes', '6': 'Sábado', '7': 'Domingo' }).map(([num, dia]) => (
                                                <div key={num} className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 transition-colors hover:border-violet-100 hover:bg-violet-50/40">
                                                    <div className="mb-3 flex items-center justify-between">
                                                        <span className="text-sm font-black text-slate-800">{dia}</span>
                                                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${scheduleForm.data.days[num]?.start && scheduleForm.data.days[num]?.end ? 'bg-violet-100 text-violet-700' : 'bg-slate-200 text-slate-500'}`}>
                                                            {scheduleForm.data.days[num]?.start && scheduleForm.data.days[num]?.end ? 'Activo' : 'Sin horario'}
                                                        </span>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div className="space-y-1.5">
                                                            <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Entrada</label>
                                                            <input type="time" value={scheduleForm.data.days[num]?.start || ''} className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium shadow-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100" onChange={e => {
                                                            const newDays = { ...scheduleForm.data.days };
                                                            newDays[num] = { ...newDays[num], start: e.target.value };
                                                            scheduleForm.setData('days', newDays);
                                                        }} />
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Salida</label>
                                                            <input type="time" value={scheduleForm.data.days[num]?.end || ''} className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium shadow-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100" onChange={e => {
                                                            const newDays = { ...scheduleForm.data.days };
                                                            newDays[num] = { ...newDays[num], end: e.target.value };
                                                            scheduleForm.setData('days', newDays);
                                                        }} />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            </div>
                                            <div className="flex flex-col gap-3 rounded-2xl border border-amber-100 bg-amber-50 p-4 md:flex-row md:items-center md:justify-between">
                                                <div>
                                                    <p className="text-sm font-black text-amber-900">Aplicación masiva</p>
                                                    <p className="text-xs font-medium text-amber-700">Los días sin horas se borrarán del horario de referencia.</p>
                                                </div>
                                                <Button disabled={scheduleForm.processing || eligibleBecarioUserIds.length === 0} className="h-12 rounded-2xl bg-violet-600 px-8 font-bold text-white shadow-lg shadow-violet-100 hover:bg-violet-700">
                                                    {scheduleForm.processing ? 'Aplicando...' : 'Aplicar horario'}
                                                </Button>
                                            </div>
                                        </form>
                                    </Card>
                                </TabsContent>

                                <TabsContent value="ausencias" className="animate-in fade-in duration-300">
                                    <Card className="overflow-hidden border-none shadow-xl bg-white rounded-3xl">
                                        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-900">Solicitudes de ausencia</h3>
                                                <p className="text-sm text-slate-500">Revisa las solicitudes de los becarios filtrados y deja una respuesta.</p>
                                            </div>
                                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                                                {managerAbsences.length} solicitudes
                                            </span>
                                        </div>

                                        {managerAbsences.length === 0 ? (
                                            <div className="px-6 py-12 text-center text-slate-400">
                                                No hay ausencias para los filtros actuales.
                                            </div>
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
                                                                <td className="px-6 py-4 font-medium text-slate-700">
                                                                    {absence.date ? new Date(absence.date).toLocaleDateString('es-ES') : '--'}
                                                                </td>
                                                                <td className="px-6 py-4 text-slate-600">
                                                                    {absence.reason}
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold border ${getAbsenceBadgeClass(absence.status)}`}>
                                                                        {absence.status === 'approved' ? 'Aprobada' : absence.status === 'rejected' ? 'Rechazada' : 'Pendiente'}
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    {absence.attachment_url ? (
                                                                        <a
                                                                            href={absence.attachment_url}
                                                                            target="_blank"
                                                                            rel="noreferrer"
                                                                            className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                                                                        >
                                                                            Ver archivo
                                                                        </a>
                                                                    ) : (
                                                                        <span className="text-slate-400">Sin archivo</span>
                                                                    )}
                                                                </td>
                                                                <td className="px-6 py-4 text-slate-500">
                                                                    {absence.tutor_comment || 'Pendiente de revisión'}
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <div className="flex justify-end">
                                                                        <Button
                                                                            type="button"
                                                                            variant="outline"
                                                                            size="sm"
                                                                            className="rounded-xl"
                                                                            onClick={() => openReviewAbsence(absence)}
                                                                        >
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
                                </TabsContent>
                                </Tabs>
                            </div>
                        )}
                    </>
                )}

                {/* --- VISTA BECARIO --- */}
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
                            <DialogDescription>
                                Ajusta la entrada, salida y observaciones del fichaje seleccionado.
                            </DialogDescription>
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
                            <DialogDescription>
                                Marca la solicitud como aprobada o rechazada y deja una observación para el becario.
                            </DialogDescription>
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
                                    placeholder="Motivo de la aprobacion o rechazo"
                                />
                            </div>

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={closeReviewAbsence}>
                                    Cancelar
                                </Button>
                                <Button type="submit" disabled={reviewForm.processing}>
                                    {reviewForm.processing ? 'Guardando...' : 'Guardar revision'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
