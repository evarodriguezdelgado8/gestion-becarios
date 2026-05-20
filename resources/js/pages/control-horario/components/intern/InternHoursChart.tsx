import { BarChart3, ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Card } from '@/components/ui/card';

import { formatDurationFromHours, getIsoWeekday, getRegistryWorkedHours, hoursBetweenTimeStrings, toDateKey } from './internUtils';
import type { Period } from './internUtils';

interface InternHoursChartProps {
    activeSession: any;
    registries: any[];
    schedules: any[];
    liveNow: Date;
}

type ChartDay = {
    date: Date;
    dateKey: string;
    expectedHours: number;
    workedHours: number;
    isToday: boolean;
    workedLabel: string;
    workedPercent: number;
    expectedPercent: number;
    isCapped: boolean;
};

const CHART_HEIGHT = 220;
const AXIS_TICKS = 4;
const TOOLTIP_WIDTH = 176;
const TOOLTIP_HEIGHT = 132;

const getChartScaleMax = (days: { workedHours: number; expectedHours: number }[]) => {
    const dailyPeaks = days
        .map((day) => Math.max(day.workedHours, day.expectedHours))
        .filter((hours) => hours > 0)
        .sort((a, b) => a - b);

    if (dailyPeaks.length === 0) return 1;

    const robustIndex = Math.min(dailyPeaks.length - 1, Math.floor((dailyPeaks.length - 1) * 0.85));
    const robustPeak = dailyPeaks[robustIndex];
    const expectedPeak = Math.max(...days.map((day) => day.expectedHours));
    const scaleBase = Math.max(1, robustPeak, expectedPeak);

    return Math.ceil(scaleBase * 1.12 * 2) / 2;
};

export default function InternHoursChart({ activeSession, registries, schedules, liveNow }: InternHoursChartProps) {
    const [chartPeriod, setChartPeriod] = useState<Period>('weekly');
    const [chartAnchorDate, setChartAnchorDate] = useState(() => new Date());
    const [tooltip, setTooltip] = useState<{ day: ChartDay; x: number; y: number } | null>(null);

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

    const chartHours = useMemo(() => {
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

        const maxHours = getChartScaleMax(days);

        return {
            maxHours,
            ticks: Array.from({ length: AXIS_TICKS + 1 }, (_, index) => {
                const value = (maxHours / AXIS_TICKS) * (AXIS_TICKS - index);

                return {
                    value,
                    label: value === 0 ? '0 min' : formatDurationFromHours(value),
                };
            }),
            days: days.map((day) => ({
                ...day,
                workedLabel: formatDurationFromHours(day.workedHours),
                workedPercent: Math.min(100, (day.workedHours / maxHours) * 100),
                expectedPercent: Math.min(100, (day.expectedHours / maxHours) * 100),
                isCapped: day.workedHours > maxHours,
            })),
        };
    }, [chartPeriodRange, liveNow, registries, schedules]);

    const totalWorkedHours = useMemo(
        () => chartHours.days.reduce((total, day) => total + day.workedHours, 0),
        [chartHours.days],
    );

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

    const showTooltip = (event: React.MouseEvent, day: ChartDay) => {
        const margin = 14;
        const rightSpace = window.innerWidth - event.clientX;
        const bottomSpace = window.innerHeight - event.clientY;
        const x = rightSpace > TOOLTIP_WIDTH + margin ? event.clientX + margin : event.clientX - TOOLTIP_WIDTH - margin;
        const y = bottomSpace > TOOLTIP_HEIGHT + margin ? event.clientY + margin : event.clientY - TOOLTIP_HEIGHT - margin;

        setTooltip({ day, x: Math.max(8, x), y: Math.max(8, y) });
    };

    return (
        <Card className="rounded-[32px] border-none bg-white p-6 shadow-xl">
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-emerald-500" />
                    <h3 className="font-bold text-slate-800">Horas por dia</h3>
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

            <div className="space-y-5">
                <div className="overflow-x-auto pb-2">
                    <div className="min-w-[620px]">
                        <div className="grid grid-cols-[62px_minmax(0,1fr)] gap-3">
                            <div className="relative" style={{ height: CHART_HEIGHT }}>
                                {chartHours.ticks.map((tick) => (
                                    <div
                                        key={tick.value}
                                        className="absolute right-0 translate-y-1/2 pr-1 text-right text-[10px] font-bold text-slate-400"
                                        style={{ bottom: `${(tick.value / chartHours.maxHours) * 100}%` }}
                                    >
                                        {tick.label}
                                    </div>
                                ))}
                            </div>

                            <div className="relative" style={{ height: CHART_HEIGHT }}>
                                {chartHours.ticks.map((tick) => (
                                    <span
                                        key={tick.value}
                                        className="absolute left-0 right-0 border-t border-slate-200"
                                        style={{ bottom: `${(tick.value / chartHours.maxHours) * 100}%` }}
                                    />
                                ))}

                                <div
                                    className="absolute inset-0 grid items-end gap-2 sm:gap-3"
                                    style={{ gridTemplateColumns: `repeat(${chartHours.days.length}, minmax(${chartPeriod === 'monthly' ? '18px' : '38px'}, 1fr))` }}
                                >
                                    {chartHours.days.map((day) => (
                                        <div
                                            key={day.dateKey}
                                            className="relative flex h-full min-w-0 items-end justify-center"
                                            onMouseMove={(event) => day.workedHours > 0 && showTooltip(event, day)}
                                            onMouseLeave={() => setTooltip(null)}
                                        >
                                            {day.expectedHours > 0 && (
                                                <span
                                                    className="absolute left-0 right-0 z-10 border-t border-dashed border-sky-300"
                                                    style={{ bottom: `${day.expectedPercent}%` }}
                                                />
                                            )}
                                            <span
                                                className={`w-full max-w-9 rounded-t-lg transition-all duration-500 ${day.isToday && activeSession ? 'bg-blue-500' : day.workedHours >= day.expectedHours && day.expectedHours > 0 ? 'bg-emerald-500' : 'bg-amber-400'}`}
                                                style={{ height: `${Math.max(day.workedHours > 0 ? 7 : 0, day.workedPercent)}%` }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div
                            className="mt-2 grid pl-[74px] text-center"
                            style={{ gridTemplateColumns: `repeat(${chartHours.days.length}, minmax(${chartPeriod === 'monthly' ? '18px' : '38px'}, 1fr))` }}
                        >
                            {chartHours.days.map((day) => (
                                <div key={day.dateKey} className="min-w-0">
                                    <p className="truncate text-[11px] font-black uppercase text-slate-500">
                                        {day.date.toLocaleDateString('es-ES', { weekday: 'short' }).slice(0, 1)}
                                    </p>
                                    {chartPeriod === 'weekly' && (
                                        <p className="text-[10px] font-semibold text-slate-400">
                                            {day.date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="grid gap-3 rounded-2xl bg-slate-50/80 p-4 sm:grid-cols-2 xl:grid-cols-5">
                    <LegendItem colorClass="bg-emerald-500" label="Horas realizadas" value={formatDurationFromHours(totalWorkedHours)} />
                    <LegendItem colorClass="bg-amber-400" label="Menos de lo previsto" value="Pendiente" />
                    <LegendItem colorClass="bg-blue-500" label="Fichaje en curso" value={activeSession ? 'Activo' : 'Sin fichaje'} muted={!activeSession} />
                    <div className="flex items-start gap-3">
                        <span className="mt-2 h-0 w-5 border-t border-dashed border-sky-300" />
                        <div>
                            <p className="text-[11px] font-bold uppercase text-slate-400">Horas previstas</p>
                            <p className="text-sm font-black text-slate-900">Horario asignado</p>
                        </div>
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-400 sm:col-span-2 xl:col-span-1">
                        Los picos muy altos se ajustan visualmente para mantener legibles el resto de dias.
                    </p>
                </div>
            </div>

            {tooltip && (
                <HoursTooltip
                    day={tooltip.day}
                    activeSession={activeSession}
                    x={tooltip.x}
                    y={tooltip.y}
                />
            )}
        </Card>
    );
}

function HoursTooltip({ day, activeSession, x, y }: { day: ChartDay; activeSession: any; x: number; y: number }) {
    const markerClass = day.isToday && activeSession
        ? 'bg-blue-500'
        : day.workedHours >= day.expectedHours && day.expectedHours > 0
            ? 'bg-emerald-500'
            : 'bg-amber-400';

    return (
        <div
            className="pointer-events-none fixed z-[9999] w-44 rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-2xl shadow-slate-900/15 ring-1 ring-slate-900/5"
            style={{ left: x, top: y }}
        >
            <div className="mb-2 border-b border-slate-100 pb-2">
                <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
                    {day.date.toLocaleDateString('es-ES', { weekday: 'long' })}
                </p>
                <p className="text-xs font-bold text-slate-800">
                    {day.date.toLocaleDateString('es-ES', { day: '2-digit', month: 'long' })}
                </p>
            </div>
            <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2 text-[11px] font-bold text-slate-500">
                        <span className={`h-2.5 w-2.5 rounded-full ${markerClass}`} />
                        Realizadas
                    </span>
                    <span className="text-xs font-black text-slate-900">
                        {day.workedLabel}{day.isCapped ? '+' : ''}
                    </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2 text-[11px] font-bold text-slate-500">
                        <span className="h-0 w-3 border-t border-dashed border-sky-300" />
                        Previstas
                    </span>
                    <span className="text-xs font-black text-slate-900">
                        {day.expectedHours > 0 ? formatDurationFromHours(day.expectedHours) : 'Sin horario'}
                    </span>
                </div>
            </div>
        </div>
    );
}

function LegendItem({ colorClass, label, value, muted = false }: { colorClass: string; label: string; value: string; muted?: boolean }) {
    return (
        <div className={`flex items-start gap-3 ${muted ? 'opacity-50' : ''}`}>
            <span className={`mt-1.5 h-3 w-3 rounded-full ${colorClass}`} />
            <div>
                <p className="text-[11px] font-bold uppercase text-slate-400">{label}</p>
                <p className="text-sm font-black text-slate-900">{value}</p>
            </div>
        </div>
    );
}
