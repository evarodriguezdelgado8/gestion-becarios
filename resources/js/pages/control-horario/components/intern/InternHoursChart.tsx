import { BarChart3, ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Card } from '@/components/ui/card';

import { formatDurationFromHours, getIsoWeekday, getRegistryWorkedHours, hoursBetweenTimeStrings, toDateKey, type Period } from './internUtils';

interface InternHoursChartProps {
    activeSession: any;
    registries: any[];
    schedules: any[];
    liveNow: Date;
}

export default function InternHoursChart({ activeSession, registries, schedules, liveNow }: InternHoursChartProps) {
    const [chartPeriod, setChartPeriod] = useState<Period>('weekly');
    const [chartAnchorDate, setChartAnchorDate] = useState(() => new Date());

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
            const workedHours = registries.reduce((acc, registry) => {
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
    }, [chartPeriodRange, liveNow, registries, schedules]);

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

    return (
        <Card className="rounded-[32px] border-none bg-white p-6 shadow-xl">
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-emerald-500" />
                    <h3 className="font-bold text-slate-800">Horas por día</h3>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="grid grid-cols-2 rounded-2xl bg-slate-100 p-1">
                        <button
                            type="button"
                            onClick={() => setChartPeriod('weekly')}
                            className={`rounded-xl px-4 py-2 text-xs font-black transition-colors ${chartPeriod === 'weekly' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Semana
                        </button>
                        <button
                            type="button"
                            onClick={() => setChartPeriod('monthly')}
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
                <div className="grid gap-2 sm:gap-3" style={{ gridTemplateColumns: `repeat(${chartHoursData.length}, minmax(${chartPeriod === 'monthly' ? '48px' : '72px'}, 1fr))` }}>
                    {chartHoursData.map((day) => (
                        <div key={day.dateKey} className="min-w-0">
                            <div className={`flex h-44 flex-col justify-end rounded-2xl border px-1.5 py-2 ${day.isToday ? 'border-blue-100 bg-blue-50/70' : 'border-slate-100 bg-slate-50/80'}`}>
                                <span className="mb-2 truncate text-center text-[10px] font-black text-slate-600" title={day.workedLabel}>
                                    {day.workedLabel}
                                </span>
                                <div className="relative mx-auto flex h-28 w-full max-w-10 items-end overflow-hidden rounded-full bg-white shadow-inner">
                                    {day.expectedHours > 0 && (
                                        <span className="absolute left-0 right-0 z-10 border-t border-dashed border-sky-300" style={{ bottom: `${day.expectedPercent}%` }} />
                                    )}
                                    <span
                                        className={`w-full rounded-full transition-all duration-500 ${day.isToday && activeSession ? 'bg-blue-500' : day.workedHours >= day.expectedHours && day.expectedHours > 0 ? 'bg-emerald-500' : 'bg-amber-400'}`}
                                        style={{ height: `${day.workedPercent}%` }}
                                    />
                                </div>
                            </div>
                            <div className="mt-2 text-center">
                                <p className="truncate text-[11px] font-black uppercase text-slate-500">{day.date.toLocaleDateString('es-ES', { weekday: 'short' })}</p>
                                <p className="text-[10px] font-semibold text-slate-400">{day.date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}</p>
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
    );
}
