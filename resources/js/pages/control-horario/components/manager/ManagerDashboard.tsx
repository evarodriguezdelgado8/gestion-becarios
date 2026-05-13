import { router, useForm } from '@inertiajs/react';
import { Calendar as CalendarIcon, Edit3, FileText, History, Users } from 'lucide-react';
import {  useEffect, useState } from 'react';
import type {FormEvent} from 'react';
import { toast } from 'sonner';

import ClearFiltersButton from '@/components/common/ClearFiltersButton';
import { Card } from '@/components/ui/card';
import { MultiSelect } from '@/components/ui/multi-select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import AbsencesTable from './AbsencesTable';
import AttendanceCards from './AttendanceCards';
import BulkScheduleForm from './BulkScheduleForm';
import ManagerAlertsCard from './ManagerAlertsCard';
import { ManagerHomePanel, SummaryCard } from './ManagerHomePanel';
import ManagerPdfCard from './ManagerPdfCard';
import { formatDurationFromHours, getIsoWeekday, toDateKey } from './managerUtils';
import ManualRegistryForm from './ManualRegistryForm';
import RegistriesTable from './RegistriesTable';

interface DaySchedule {
    start: string;
    end: string;
}

interface ScheduleDays {
    [key: string]: DaySchedule;
}

interface ManagerDashboardProps {
    becarios: any[];
    managerRegistries: any[];
    managerAbsences: any[];
    centers: any[];
    allInterns: any[];
    cycleOptions: any[];
    filters: any;
    openEditRegistry: (registry: any) => void;
    openReviewAbsence: (absence: any) => void;
    setDeletingRegistry: (registry: any) => void;
}

export default function ManagerDashboard({
    becarios,
    managerRegistries,
    managerAbsences,
    centers,
    allInterns,
    cycleOptions,
    filters,
    openEditRegistry,
    openReviewAbsence,
    setDeletingRegistry,
}: ManagerDashboardProps) {
    const [selectedInterns, setSelectedInterns] = useState(filters.intern_id ? filters.intern_id.split(',') : []);
    const [selectedCenters, setSelectedCenters] = useState(filters.center_id ? filters.center_id.split(',') : []);
    const [selectedCycles, setSelectedCycles] = useState(filters.academic_cycle ? filters.academic_cycle.split(',') : []);
    const [currentTime, setCurrentTime] = useState(() => Date.now());
    const [pdfPeriod, setPdfPeriod] = useState<'weekly' | 'monthly'>('weekly');
    const [pdfDate, setPdfDate] = useState(() => {
        const date = new Date();
        const month = `${date.getMonth() + 1}`.padStart(2, '0');
        const day = `${date.getDate()}`.padStart(2, '0');

        return `${date.getFullYear()}-${month}-${day}`;
    });
    const [pdfInternId, setPdfInternId] = useState('');

    const manualForm = useForm({
        user_ids: [] as number[],
        check_in: '',
        check_out: '',
        status: 'normal',
        note: '',
    });

    const scheduleForm = useForm<{ user_ids: number[]; days: ScheduleDays }>({
        user_ids: [],
        days: {
            '1': { start: '', end: '' },
            '2': { start: '', end: '' },
            '3': { start: '', end: '' },
            '4': { start: '', end: '' },
            '5': { start: '', end: '' },
            '6': { start: '', end: '' },
            '7': { start: '', end: '' },
        },
    });

    const hasActiveFilters = selectedInterns.length > 0 || selectedCenters.length > 0 || selectedCycles.length > 0;
    const eligibleBecarios = becarios.filter((becario: any) => Boolean(becario.user_id));
    const eligibleBecarioUserIds = eligibleBecarios.map((becario: any) => becario.user_id);
    const hasActiveManagerRegistry = managerRegistries.some((registry: any) => !registry.check_out);

    useEffect(() => {
        if (!hasActiveManagerRegistry) {
            return;
        }

        //setCurrentTime(Date.now());
        const interval = setInterval(() => setCurrentTime(Date.now()), 30000);

        return () => clearInterval(interval);
    }, [hasActiveManagerRegistry]);

    const applyFilters = (newFilters: any) => {
        const params: any = {
            intern_id: selectedInterns.join(','),
            center_id: selectedCenters.join(','),
            academic_cycle: selectedCycles.join(','),
            ...newFilters,
        };

        Object.keys(params).forEach((key) => !params[key] && delete params[key]);
        router.get('/control-horario', params, { preserveState: true, replace: true });
    };

    const handleManualSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (eligibleBecarioUserIds.length === 0) {
            toast.error('No hay becarios con usuario asociado en los filtros actuales');
            return;
        }

        manualForm.transform((data) => ({
            ...data,
            user_ids: eligibleBecarioUserIds,
        }));
        manualForm.post('/control-horario/manual', {
            onSuccess: () => {
                manualForm.reset();
                toast.success('Registros creados correctamente');
            },
            onError: () => toast.error('Error al crear los registros'),
        });
    };

    const handleScheduleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (eligibleBecarioUserIds.length === 0) {
            toast.error('No hay becarios con usuario asociado en los filtros actuales');
            return;
        }

        scheduleForm.transform((data) => ({
            user_ids: eligibleBecarioUserIds,
            schedules: data.days,
        }));
        scheduleForm.post('/control-horario/bulk-schedule', {
            onSuccess: () => toast.success('Horarios actualizados correctamente'),
            onError: () => toast.error('Error al actualizar horarios'),
        });
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

    const selectedSingleBecario =
        selectedInterns.length === 1 ? becarios.find((becario: any) => String(becario.id) === selectedInterns[0]) : null;
    const managerPdfInternId = selectedSingleBecario?.user_id ? selectedSingleBecario.id : pdfInternId;
    const todayAlertKey = toDateKey(new Date());
    const lateRegistries = managerRegistries.filter((registry: any) => registry.status === 'late');
    const todayLateRegistries = lateRegistries.filter((registry: any) => toDateKey(new Date(registry.check_in)) === todayAlertKey);
    const pendingAbsenceRequests = managerAbsences.filter((absence: any) => absence.status === 'pending');
    const todayApprovedAbsences = managerAbsences.filter((absence: any) => {
        if (absence.status !== 'approved') {
            return false;
        }

        const reviewedAt = absence.reviewed_at || absence.updated_at;

        return reviewedAt ? toDateKey(new Date(reviewedAt)) === todayAlertKey : false;
    });
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

    const handlePdfDownload = (internId?: string | number) => {
        const params = new URLSearchParams({
            period: pdfPeriod,
            date: pdfDate,
        });

        if (internId) {
            params.set('intern_id', String(internId));
        }

        window.open(`/control-horario/parte-horas/pdf?${params.toString()}`, '_blank', 'noopener,noreferrer');
    };

    return (
        <>
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Control de asistencia</h1>
                </div>
                {hasActiveFilters && (
                    <div className="flex items-center gap-2 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700 shadow-sm">
                        <Users className="h-4 w-4" /> {becarios.length} Seleccionados
                    </div>
                )}
            </div>

            <Card className="rounded-3xl border-none bg-white p-5 shadow-xl">
                <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-4">
                    <div className="space-y-1.5">
                        <label className="ml-1 text-[11px] font-bold uppercase text-slate-400">Becario</label>
                        <MultiSelect
                            options={allInterns.map((i) => ({ label: `${i.name} ${i.last_name}`, value: i.id.toString() }))}
                            selected={selectedInterns}
                            onChange={(v) => {
                                setSelectedInterns(v);
                                applyFilters({ intern_id: v.join(',') });
                            }}
                            placeholder="Buscar becarios..."
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="ml-1 text-[11px] font-bold uppercase text-slate-400">Centro</label>
                        <MultiSelect
                            options={centers.map((c) => ({ label: c.name, value: c.id.toString() }))}
                            selected={selectedCenters}
                            onChange={(v) => {
                                setSelectedCenters(v);
                                applyFilters({ center_id: v.join(',') });
                            }}
                            placeholder="Todos los centros"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="ml-1 text-[11px] font-bold uppercase text-slate-400">Ciclo</label>
                        <MultiSelect
                            options={cycleOptions}
                            selected={selectedCycles}
                            onChange={(v) => {
                                setSelectedCycles(v);
                                applyFilters({ academic_cycle: v.join(',') });
                            }}
                            placeholder="Cualquier ciclo"
                        />
                    </div>
                    <ClearFiltersButton onClick={() => router.get('/control-horario')} className="w-full md:w-auto" />
                </div>
            </Card>

            {!hasActiveFilters ? (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <SummaryCard title="Becarios" value={becarios.length} detail="Con seguimiento en el sistema" />
                        <SummaryCard title="En curso" value={activeTodayRegistries.length} detail="Fichajes activos ahora" valueClass="text-blue-600" />
                        <SummaryCard title="Retrasos hoy" value={todayLateRegistries.length} detail="Entradas fuera del margen" valueClass="text-amber-600" />
                        <SummaryCard title="Ausencias" value={pendingAbsenceRequests.length} detail="Solicitudes pendientes" valueClass="text-orange-600" />
                    </div>

                    <ManagerHomePanel
                        totalManagerAlerts={totalManagerAlerts}
                        todayLateRegistries={todayLateRegistries}
                        todayMissingAlerts={todayMissingAlerts}
                        pendingAbsenceRequests={pendingAbsenceRequests}
                        todayRegistries={todayRegistries}
                        dashboardAttentionItems={dashboardAttentionItems}
                        getRegistryHoursLabel={getRegistryHoursLabel}
                        openReviewAbsence={openReviewAbsence}
                    />
                </div>
            ) : (
                <div className="space-y-6">
                    <ManagerPdfCard
                        selectedSingleBecario={selectedSingleBecario}
                        pdfInternId={pdfInternId}
                        setPdfInternId={setPdfInternId}
                        pdfPeriod={pdfPeriod}
                        setPdfPeriod={setPdfPeriod}
                        pdfDate={pdfDate}
                        setPdfDate={setPdfDate}
                        managerPdfInternId={managerPdfInternId}
                        becarios={becarios}
                        handlePdfDownload={handlePdfDownload}
                    />

                    <ManagerAlertsCard
                        totalManagerAlerts={totalManagerAlerts}
                        todayLateRegistries={todayLateRegistries}
                        todayMissingAlerts={todayMissingAlerts}
                        todayPendingCheckIns={todayPendingCheckIns}
                        pendingAbsenceRequests={pendingAbsenceRequests}
                        todayApprovedAbsences={todayApprovedAbsences}
                        lateRegistries={lateRegistries}
                        getRegistryHoursLabel={getRegistryHoursLabel}
                        openReviewAbsence={openReviewAbsence}
                    />

                    <Tabs defaultValue="asistencia" className="w-full space-y-6">
                        <TabsList className="grid h-auto w-full grid-cols-4 rounded-2xl bg-slate-100 p-1.5 md:inline-flex md:w-auto">
                            <TabsTrigger value="asistencia" className="rounded-xl px-6 py-2 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                <History className="mr-2 h-4 w-4" /> Asistencias
                            </TabsTrigger>
                            <TabsTrigger value="manual" className="rounded-xl px-6 py-2 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                <Edit3 className="mr-2 h-4 w-4" /> Registro Manual
                            </TabsTrigger>
                            <TabsTrigger value="horario" className="rounded-xl px-6 py-2 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                <CalendarIcon className="mr-2 h-4 w-4" /> Horarios
                            </TabsTrigger>
                            <TabsTrigger value="ausencias" className="rounded-xl px-6 py-2 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                <FileText className="mr-2 h-4 w-4" /> Ausencias
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="asistencia" className="animate-in space-y-6 fade-in duration-300">
                            <AttendanceCards becarios={becarios} getDayStatus={getDayStatus} />
                            <RegistriesTable
                                managerRegistries={managerRegistries}
                                getRegistryHoursLabel={getRegistryHoursLabel}
                                openEditRegistry={openEditRegistry}
                                setDeletingRegistry={setDeletingRegistry}
                            />
                        </TabsContent>

                        <TabsContent value="manual" className="animate-in fade-in duration-300">
                            <ManualRegistryForm
                                manualForm={manualForm}
                                eligibleBecarios={eligibleBecarios}
                                eligibleBecarioUserIds={eligibleBecarioUserIds}
                                handleManualSubmit={handleManualSubmit}
                            />
                        </TabsContent>

                        <TabsContent value="horario" className="animate-in fade-in duration-300">
                            <BulkScheduleForm
                                scheduleForm={scheduleForm}
                                eligibleBecarios={eligibleBecarios}
                                eligibleBecarioUserIds={eligibleBecarioUserIds}
                                handleScheduleSubmit={handleScheduleSubmit}
                            />
                        </TabsContent>

                        <TabsContent value="ausencias" className="animate-in fade-in duration-300">
                            <AbsencesTable managerAbsences={managerAbsences} openReviewAbsence={openReviewAbsence} />
                        </TabsContent>
                    </Tabs>
                </div>
            )}
        </>
    );
}
