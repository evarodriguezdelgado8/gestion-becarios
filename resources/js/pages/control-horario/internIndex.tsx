import esLocale from '@fullcalendar/core/locales/es';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import { useForm } from '@inertiajs/react';
import {
    ArrowRight,
    BarChart3,
    Calendar as CalendarIcon,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Clock,
    Download,
    FileText,
    History,
    Info,
    LayoutDashboard,
    Play,
    Plus,
    Square,
} from 'lucide-react';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Props {
    activeSession: any;
    registries: any[]; // Fichajes reales
    schedules: any[];  // Horarios asignados por admin
    absences: any[];
    intern?: any;
    generalProcessing: boolean;
    handleCheckIn: () => void;
    handleCheckOut: () => void;
    elapsedTime: string;
    pdfPeriod: 'weekly' | 'monthly';
    setPdfPeriod: (period: 'weekly' | 'monthly') => void;
    pdfDate: string;
    setPdfDate: (date: string) => void;
    handlePdfDownload: () => void;
}

const formatDurationFromHours = (value: number | string | null | undefined) => {
    const hoursValue = Number(value || 0);
    const totalMinutes = Math.round(hoursValue * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours > 0 && minutes > 0) return `${hours} h ${minutes} min`;
    if (hours > 0) return `${hours} h`;

    return `${minutes} min`;
};

const getRegistryWorkedHours = (registry: any, fallbackEnd: Date) => {
    if (!registry.check_in) return 0;

    const start = new Date(registry.check_in).getTime();
    const end = registry.check_out ? new Date(registry.check_out).getTime() : fallbackEnd.getTime();

    return Math.max(0, (end - start) / 3600000);
};

const hoursBetweenTimeStrings = (dateKey: string, startTime?: string, endTime?: string) => {
    if (!startTime || !endTime) return 0;

    const start = new Date(`${dateKey}T${startTime}`);
    const end = new Date(`${dateKey}T${endTime}`);

    return Math.max(0, (end.getTime() - start.getTime()) / 3600000);
};

export default function InternDashboard({ 
    activeSession, registries, schedules, absences, intern, generalProcessing, handleCheckIn, handleCheckOut, elapsedTime, pdfPeriod, setPdfPeriod, pdfDate, setPdfDate, handlePdfDownload
}: Props) {
    
    const horasTotalesObjetivo = Math.max(Number(intern?.total_hours || 400), 1);
    const [showAbsenceForm, setShowAbsenceForm] = useState(false);
    const [chartPeriod, setChartPeriod] = useState<'weekly' | 'monthly'>('weekly');
    const [chartAnchorDate, setChartAnchorDate] = useState(() => new Date());
    const chronologicalRegistries = useMemo(
        () => [...registries].sort((a, b) => new Date(b.check_in).getTime() - new Date(a.check_in).getTime()),
        [registries],
    );

    const absenceForm = useForm({
        date: '',
        reason: '',
        attachment: null as File | null,
    });

    const todayIsoDay = (() => {
        const day = new Date().getDay();
        return day === 0 ? 7 : day;
    })();

    const todaySchedule = (schedules || []).find((schedule) => schedule.day_of_week === todayIsoDay);

    const handleAbsenceSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        absenceForm.post('/control-horario/ausencias', {
            forceFormData: true,
            onSuccess: () => {
                absenceForm.reset();
                setShowAbsenceForm(false);
            },
        });
    };

    const getAbsenceBadgeClass = (status: string) => {
        switch (status) {
            case 'approved':
                return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'rejected':
                return 'bg-rose-50 text-rose-600 border-rose-100';
            default:
                return 'bg-amber-50 text-amber-600 border-amber-100';
        }
    };

    const formatTime = (time: string) => time?.slice(0, 5) || '--:--';

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

    const liveNow = useMemo(() => new Date(), [elapsedTime]);
    const registriesWithActiveSession = useMemo(() => {
        if (!activeSession || registries.some((registry) => registry.id === activeSession.id)) {
            return registries;
        }

        return [activeSession, ...registries];
    }, [activeSession, registries]);
    const horasHechas = useMemo(
        () => Number(registriesWithActiveSession.reduce((acc, registry) => acc + getRegistryWorkedHours(registry, liveNow), 0).toFixed(1)),
        [liveNow, registriesWithActiveSession],
    );
    const porcentaje = Math.min((horasHechas / horasTotalesObjetivo) * 100, 100);
    const chartPeriodRange = useMemo(() => {
        const start = new Date(chartAnchorDate);
        start.setHours(0, 0, 0, 0);

        if (chartPeriod === 'weekly') {
            start.setDate(start.getDate() - (getIsoWeekday(start) - 1));
        } else {
            start.setDate(1);
        }

        const end = new Date(start);
        if (chartPeriod === 'weekly') {
            end.setDate(start.getDate() + 6);
        } else {
            end.setMonth(start.getMonth() + 1, 0);
        }

        return { start, end };
    }, [chartAnchorDate, chartPeriod]);

    const chartPeriodLabel = useMemo(() => {
        if (chartPeriod === 'monthly') {
            return chartPeriodRange.start.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
        }

        return `${chartPeriodRange.start.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })} - ${chartPeriodRange.end.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}`;
    }, [chartPeriod, chartPeriodRange]);

    const chartHoursData = useMemo(() => {
        const daysCount = Math.round((chartPeriodRange.end.getTime() - chartPeriodRange.start.getTime()) / 86400000) + 1;
        const days = Array.from({ length: daysCount }, (_, index) => {
            const day = new Date(chartPeriodRange.start);
            day.setDate(chartPeriodRange.start.getDate() + index);
            const dateKey = toDateKey(day);
            const schedule = schedules.find((item) => item.day_of_week === getIsoWeekday(day));
            const workedHours = registriesWithActiveSession.reduce((acc, registry) => {
                const registryDateKey = toDateKey(new Date(registry.check_in));

                return registryDateKey === dateKey ? acc + getRegistryWorkedHours(registry, liveNow) : acc;
            }, 0);

            return {
                date: day,
                dateKey,
                expectedHours: hoursBetweenTimeStrings(dateKey, schedule?.start_time, schedule?.end_time),
                workedHours,
                isToday: dateKey === toDateKey(liveNow),
            };
        });

        const maxHours = Math.max(1, ...days.map((day) => Math.max(day.workedHours, day.expectedHours)));

        return days.map((day) => ({
            ...day,
            workedLabel: formatDurationFromHours(day.workedHours),
            workedPercent: Math.min(100, (day.workedHours / maxHours) * 100),
            expectedPercent: Math.min(100, (day.expectedHours / maxHours) * 100),
        }));
    }, [chartPeriodRange, liveNow, registriesWithActiveSession, schedules]);

    const shiftChartPeriod = (direction: -1 | 1) => {
        setChartAnchorDate((current) => {
            const next = new Date(current);

            if (chartPeriod === 'weekly') {
                next.setDate(current.getDate() + direction * 7);
            } else {
                next.setMonth(current.getMonth() + direction);
            }

            return next;
        });
    };

    const handleChartPeriodChange = (period: 'weekly' | 'monthly') => {
        setChartPeriod(period);
    };

    const calendarEvents = useMemo(() => {
        const registryDates = new Set(registries.map((reg) => toDateKey(new Date(reg.check_in))));
        const absenceDates = new Set(absences.filter((absence) => absence.date).map((absence) => absence.date));
        const events: any[] = [];

        (schedules || []).forEach((schedule) => {
            events.push({
                id: `schedule-${schedule.id ?? schedule.day_of_week}`,
                title: `Previsto ${formatTime(schedule.start_time)}-${formatTime(schedule.end_time)}`,
                daysOfWeek: [schedule.day_of_week === 7 ? 0 : schedule.day_of_week],
                startTime: schedule.start_time,
                endTime: schedule.end_time,
                backgroundColor: '#eff6ff',
                textColor: '#1e40af',
                borderColor: '#bfdbfe',
                display: 'block',
            });
        });

        registries.forEach((reg) => {
            const horas = reg.check_out
                ? formatDurationFromHours((new Date(reg.check_out).getTime() - new Date(reg.check_in).getTime()) / 3600000)
                : 'En curso';
            const isLate = reg.status === 'late';

            events.push({
                id: `registry-${reg.id}`,
                title: reg.check_out ? `Real: ${horas}` : 'Fichaje en curso',
                start: reg.check_in,
                end: reg.check_out || liveNow,
                backgroundColor: !reg.check_out ? '#dbeafe' : isLate ? '#fef3c7' : '#d1fae5',
                textColor: !reg.check_out ? '#1d4ed8' : isLate ? '#92400e' : '#065f46',
                borderColor: !reg.check_out ? '#93c5fd' : isLate ? '#fcd34d' : '#6ee7b7',
            });
        });

        absences.forEach((absence) => {
            if (!absence.date) return;

            const statusConfig = absence.status === 'approved'
                ? { title: 'Ausencia aprobada', backgroundColor: '#ecfdf5', textColor: '#047857', borderColor: '#a7f3d0' }
                : absence.status === 'rejected'
                    ? { title: 'Ausencia rechazada', backgroundColor: '#fff1f2', textColor: '#be123c', borderColor: '#fecdd3' }
                    : { title: 'Ausencia pendiente', backgroundColor: '#fffbeb', textColor: '#b45309', borderColor: '#fde68a' };

            events.push({
                id: `absence-${absence.id}`,
                start: absence.date,
                allDay: true,
                ...statusConfig,
            });
        });

        const today = new Date();
        const start = intern?.start_date ? new Date(`${intern.start_date}T00:00:00`) : new Date(today);
        start.setDate(start.getDate() - (intern?.start_date ? 0 : 90));

        const end = intern?.end_date ? new Date(`${intern.end_date}T00:00:00`) : new Date(today);
        if (end > today) end.setTime(today.getTime());

        for (const cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
            const dateKey = toDateKey(cursor);
            const schedule = schedules.find((item) => item.day_of_week === getIsoWeekday(cursor));

            if (!schedule || registryDates.has(dateKey) || absenceDates.has(dateKey)) {
                continue;
            }

            const scheduleEnd = new Date(`${dateKey}T${schedule.end_time}`);
            if (scheduleEnd > today) {
                continue;
            }

            events.push({
                id: `missed-${dateKey}`,
                title: 'Sin fichaje',
                start: `${dateKey}T${schedule.start_time}`,
                end: `${dateKey}T${schedule.end_time}`,
                backgroundColor: '#fff1f2',
                textColor: '#be123c',
                borderColor: '#fecdd3',
            });
        }

        return events;
    }, [absences, intern?.end_date, intern?.start_date, liveNow, registries, schedules]);

    return (
        <div className="max-w-6xl mx-auto w-full space-y-8 animate-in fade-in duration-500 pb-10">
            
            <Tabs defaultValue="dashboard" className="w-full">
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    <h2 className="text-2xl font-bold text-gray-900">Control de asistencia</h2>
                </div>

                <Card className="mb-8 border-none bg-white p-5 shadow-xl rounded-3xl">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_180px_180px_auto] md:items-end">
                        <div>
                            <h3 className="font-bold text-slate-900">Parte de horas</h3>
                            <p className="text-sm text-slate-500">Descarga tu parte semanal o mensual para el centro educativo.</p>
                        </div>
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
                            onClick={handlePdfDownload}
                            className="h-10 rounded-xl bg-slate-900 font-bold text-white hover:bg-slate-800"
                        >
                            <Download className="mr-2 h-4 w-4" /> Descargar PDF
                        </Button>
                    </div>
                </Card>

                <div  className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4"> 
                    <TabsList className="bg-slate-100 p-1 rounded-2xl h-12">
                    <TabsTrigger value="dashboard" className="rounded-xl px-6 font-bold data-[state=active]:bg-white shadow-none">
                        <LayoutDashboard className="w-4 h-4 mr-2" /> Resumen
                    </TabsTrigger>
                    <TabsTrigger value="calendar" className="rounded-xl px-6 font-bold data-[state=active]:bg-white shadow-none">
                        <CalendarIcon className="w-4 h-4 mr-2" /> Mi Horario
                    </TabsTrigger>
                    <TabsTrigger value="history" className="rounded-xl px-6 font-bold data-[state=active]:bg-white shadow-none">
                        <History className="w-4 h-4 mr-2" /> Historial
                    </TabsTrigger>
                    <TabsTrigger value="absences" className="rounded-xl px-6 font-bold data-[state=active]:bg-white shadow-none">
                        <FileText className="w-4 h-4 mr-2" /> Ausencias
                    </TabsTrigger>
                    </TabsList>
                </div>

                {/* --- TAB: RESUMEN --- */}
                <TabsContent value="dashboard" className="space-y-8 mt-0 outline-none">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="md:col-span-2 p-8 rounded-[32px] border-none shadow-xl bg-white flex flex-col justify-center">
                            <div className="flex justify-between items-end mb-4">
                                <div>
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Horas Acumuladas</p>
                                    <h2 className="text-4xl font-black text-slate-900">
                                        {formatDurationFromHours(horasHechas)} <span className="text-slate-300 text-xl font-medium">/ {horasTotalesObjetivo}h</span>
                                    </h2>
                                </div>
                                <div className="text-right">
                                    <span className="text-2xl font-black text-blue-600">{porcentaje.toFixed(0)}%</span>
                                </div>
                            </div>
                            <Progress value={porcentaje} className="h-3 bg-slate-100" />
                            <p className="text-xs text-slate-400 mt-4 flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> 
                                Has completado {porcentaje.toFixed(0)}% de tus prácticas.
                            </p>
                        </Card>

                        <Card className={`p-8 rounded-[32px] border-none shadow-2xl transition-all ${activeSession ? 'bg-slate-900 text-white' : 'bg-white'}`}>
                            <p className={`text-[11px] font-bold uppercase tracking-widest mb-2 ${activeSession ? 'text-emerald-400' : 'text-slate-400'}`}>
                                {activeSession ? 'En Curso' : 'Turno Cerrado'}
                            </p>
                            <div className="text-4xl font-mono font-bold mb-8">
                                {activeSession ? elapsedTime : '00:00:00'}
                            </div>
                            
                            {!activeSession ? (
                                <Button onClick={handleCheckIn} disabled={generalProcessing} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-14 rounded-2xl shadow-lg">
                                    <Play className="mr-2 h-5 w-5 fill-current" /> Iniciar Ahora
                                </Button>
                            ) : (
                                <Button onClick={handleCheckOut} disabled={generalProcessing} variant="destructive" className="w-full font-bold h-14 rounded-2xl shadow-lg">
                                    <Square className="mr-2 h-5 w-5 fill-current" /> Terminar
                                </Button>
                            )}
                        </Card>
                    </div>

                    {/* Mini Horario de hoy */}
                    <Card className="p-6 rounded-[32px] border-none shadow-xl bg-white">
                        <div className="flex items-center gap-2 mb-4">
                            <Clock className="w-5 h-5 text-blue-500" />
                            <h3 className="font-bold text-slate-800">Horario previsto para hoy</h3>
                        </div>
                        <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex justify-between items-center">
                            <p className="text-sm font-medium text-blue-800 italic">
                                {todaySchedule
                                    ? `${todaySchedule.start_time} - ${todaySchedule.end_time}`
                                    : 'No hay horario asignado para hoy o el tutor no lo ha publicado.'}
                            </p>
                            <Info className="w-4 h-4 text-blue-400" />
                        </div>
                    </Card>

                    <Card className="p-6 rounded-[32px] border-none shadow-xl bg-white">
                        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex items-center gap-2">
                                <BarChart3 className="h-5 w-5 text-emerald-500" />
                                <h3 className="font-bold text-slate-800">Horas por día</h3>
                            </div>
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                <div className="grid grid-cols-2 rounded-2xl bg-slate-100 p-1">
                                    <button
                                        type="button"
                                        onClick={() => handleChartPeriodChange('weekly')}
                                        className={`rounded-xl px-4 py-2 text-xs font-black transition-colors ${chartPeriod === 'weekly' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        Semana
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleChartPeriodChange('monthly')}
                                        className={`rounded-xl px-4 py-2 text-xs font-black transition-colors ${chartPeriod === 'monthly' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        Mes
                                    </button>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => shiftChartPeriod(-1)}
                                        title="Periodo anterior"
                                        aria-label="Periodo anterior"
                                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </button>
                                    <span className="min-w-40 rounded-xl bg-slate-50 px-3 py-2 text-center text-xs font-black uppercase tracking-wide text-slate-600">
                                        {chartPeriodLabel}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => shiftChartPeriod(1)}
                                        title="Periodo siguiente"
                                        aria-label="Periodo siguiente"
                                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setChartAnchorDate(new Date())}
                                        className="h-10 rounded-xl border border-slate-200 px-4 text-xs font-black text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
                                    >
                                        Actual
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto pb-2">
                            <div
                                className="grid gap-2 sm:gap-3"
                                style={{ gridTemplateColumns: `repeat(${chartHoursData.length}, minmax(${chartPeriod === 'monthly' ? '48px' : '72px'}, 1fr))` }}
                            >
                            {chartHoursData.map((day) => (
                                <div key={day.dateKey} className="min-w-0">
                                    <div className={`flex h-44 flex-col justify-end rounded-2xl border px-1.5 py-2 ${day.isToday ? 'border-blue-100 bg-blue-50/70' : 'border-slate-100 bg-slate-50/80'}`}>
                                        <span className="mb-2 truncate text-center text-[10px] font-black text-slate-600" title={day.workedLabel}>
                                            {day.workedLabel}
                                        </span>
                                        <div className="relative mx-auto flex h-28 w-full max-w-10 items-end overflow-hidden rounded-full bg-white shadow-inner">
                                            {day.expectedHours > 0 && (
                                                <span
                                                    className="absolute left-0 right-0 z-10 border-t border-dashed border-sky-300"
                                                    style={{ bottom: `${day.expectedPercent}%` }}
                                                />
                                            )}
                                            <span
                                                className={`w-full rounded-full transition-all duration-500 ${day.isToday && activeSession ? 'bg-blue-500' : day.workedHours >= day.expectedHours && day.expectedHours > 0 ? 'bg-emerald-500' : 'bg-amber-400'}`}
                                                style={{ height: `${day.workedPercent}%` }}
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-2 text-center">
                                        <p className="truncate text-[11px] font-black uppercase text-slate-500">
                                            {day.date.toLocaleDateString('es-ES', { weekday: 'short' })}
                                        </p>
                                        <p className="text-[10px] font-semibold text-slate-400">
                                            {day.date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            </div>
                        </div>

                        <div className="mt-5 flex flex-wrap items-center gap-4 text-[11px] font-bold text-slate-500">
                            <span className="flex items-center gap-2">
                                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                                Horas realizadas
                            </span>
                            <span className="flex items-center gap-2">
                                <span className="h-0 w-5 border-t border-dashed border-sky-300" />
                                Horas previstas
                            </span>
                            {activeSession && (
                                <span className="flex items-center gap-2 text-blue-600">
                                    <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                                    Actualizándose en directo
                                </span>
                            )}
                        </div>
                    </Card>
                </TabsContent>

                {/* --- TAB: CALENDARIO INTERACTIVO --- */}
                <TabsContent value="calendar" className="mt-0 outline-none">
                    <Card className="p-8 rounded-[32px] border-none shadow-xl bg-white overflow-hidden">
                        <style>{`
                            .fc { --fc-border-color: #f1f5f9; font-family: inherit; }
                            .fc .fc-toolbar-title { font-weight: 800; font-size: 1.25rem; color: #0f172a; }
                            .fc .fc-button-primary { background-color: #fff; border-color: #e2e8f0; color: #64748b; font-weight: 700; text-transform: capitalize; border-radius: 12px; }
                            .fc .fc-button-primary:hover { background-color: #f8fafc; border-color: #cbd5e1; color: #0f172a; }
                            .fc .fc-button-active { background-color: #0f172a !important; border-color: #0f172a !important; color: #fff !important; }
                            .fc .fc-event { border-radius: 8px; padding: 2px 4px; border: 1px solid transparent; }
                            .fc-theme-standard td, .fc-theme-standard th { border-color: #f1f5f9; }
                        `}</style>
                        
                        <FullCalendar
                            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                            initialView="dayGridMonth"
                            headerToolbar={{
                                left: 'prev,next today',
                                center: 'title',
                                right: 'dayGridMonth,timeGridWeek'
                            }}
                            locales={[esLocale]}
                            locale={esLocale}
                            firstDay={1}
                            buttonText={{
                                today: 'Hoy',
                                month: 'Mes',
                                week: 'Semana',
                            }}
                            allDayText="Todo el día"
                            weekText="Sem."
                            events={calendarEvents}
                            height="600px"
                            eventTimeFormat={{
                                hour: '2-digit',
                                minute: '2-digit',
                                meridiem: false,
                                hour12: false
                            }}
                        />
                    </Card>
                </TabsContent>

                {/* --- TAB: HISTORIAL --- */}
                <TabsContent value="history" className="mt-0 outline-none">
                    <Card className="rounded-[32px] border-none shadow-xl overflow-hidden bg-white">
                        <div className="p-6 border-b border-slate-50 flex items-center gap-2">
                            <History className="w-5 h-5 text-slate-400" />
                            <h3 className="font-bold text-slate-800">Historial de Fichajes</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50/50">
                                    <tr className="text-left">
                                        <th className="px-8 py-4 font-bold text-slate-400 uppercase text-[10px] tracking-widest text-center">Día</th>
                                        <th className="px-8 py-4 font-bold text-slate-400 uppercase text-[10px] tracking-widest">Horario Realizado</th>
                                        <th className="px-8 py-4 font-bold text-slate-400 uppercase text-[10px] tracking-widest text-right">Estado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {chronologicalRegistries.map((reg) => (
                                        <tr key={reg.id} className="hover:bg-slate-50/30 transition-colors">
                                            <td className="px-8 py-5 text-center">
                                                <span className="block font-bold text-slate-700">{new Date(reg.check_in).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
                                                <span className="text-[10px] text-slate-400 uppercase font-medium">{new Date(reg.check_in).toLocaleDateString('es-ES', { weekday: 'short' })}</span>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-3">
                                                    <span className="bg-slate-100 px-3 py-1.5 rounded-xl text-xs font-mono font-bold text-slate-600">
                                                        {new Date(reg.check_in).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                    <ArrowRight className="w-3 h-3 text-slate-300" />
                                                    <span className="bg-slate-100 px-3 py-1.5 rounded-xl text-xs font-mono font-bold text-slate-600">
                                                        {reg.check_out ? new Date(reg.check_out).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <span className={`text-[10px] font-black px-3 py-1.5 rounded-full border ${reg.status === 'late' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                                                    {reg.status === 'late' ? 'RETRASO' : 'PUNTUAL'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </TabsContent>

                {/* --- TAB: AUSENCIAS --- */}
                <TabsContent value="absences" className="mt-0 outline-none">
                    <Card className="p-6 rounded-[32px] border-none shadow-xl bg-white flex flex-col">
                        <div className="flex items-center justify-between mb-6 px-2">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-purple-500" /> Mis Ausencias
                            </h3>
                            <Button
                                size="sm"
                                variant="outline"
                                className="rounded-xl border-purple-100 text-purple-600 font-bold hover:bg-purple-50"
                                onClick={() => setShowAbsenceForm((current) => !current)}
                            >
                                <Plus className="w-4 h-4 mr-1" /> {showAbsenceForm ? 'Cerrar' : 'Solicitar'}
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
                                            onChange={(e) => absenceForm.setData('date', e.target.value)}
                                            className="w-full rounded-2xl border border-slate-200 text-sm"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-600">Justificante</label>
                                        <input
                                            type="file"
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            onChange={(e) => absenceForm.setData('attachment', e.target.files?.[0] ?? null)}
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
                                        onChange={(e) => absenceForm.setData('reason', e.target.value)}
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
                                    <div key={absence.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center text-amber-500 shadow-sm border border-slate-100">
                                                <Clock className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-700">{absence.reason}</p>
                                                <p className="text-[10px] text-slate-400 font-medium">
                                                    {absence.date ? `Fecha solicitada: ${new Date(absence.date).toLocaleDateString('es-ES')}` : 'Sin fecha'}
                                                </p>
                                                {absence.tutor_comment && (
                                                    <p className="mt-1 text-xs text-slate-500">Tutor: {absence.tutor_comment}</p>
                                                )}
                                                {absence.attachment_url && (
                                                    <a
                                                        href={absence.attachment_url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="mt-1 inline-block text-xs font-semibold text-purple-600 hover:text-purple-700"
                                                    >
                                                        Ver justificante
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                        <span className={`text-[10px] font-black px-2 py-1 rounded-lg border ${getAbsenceBadgeClass(absence.status)}`}>
                                            {absence.status === 'approved' ? 'APROBADA' : absence.status === 'rejected' ? 'RECHAZADA' : 'PENDIENTE'}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
