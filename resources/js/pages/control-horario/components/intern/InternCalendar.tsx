import esLocale from '@fullcalendar/core/locales/es';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import { useMemo, useState } from 'react';

import { Card } from '@/components/ui/card';

import { formatDurationFromHours, formatTime, getIsoWeekday, toDateKey } from './internUtils';

interface InternCalendarProps {
    registries: any[];
    schedules: any[];
    absences: any[];
    intern?: any;
    liveNow: Date;
}

const normalizeDateKey = (value: string | Date | null | undefined) => {
    if (!value) return '';

    if (typeof value === 'string') {
        return value.slice(0, 10);
    }

    return toDateKey(value);
};

const getInitialVisibleRange = () => {
    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);

    return { start, end };
};

export default function InternCalendar({ registries, schedules, absences, intern, liveNow }: InternCalendarProps) {
    const [visibleRange, setVisibleRange] = useState(getInitialVisibleRange);

    const calendarEvents = useMemo(() => {
        const registryDates = new Set(registries.map((registry) => toDateKey(new Date(registry.check_in))));
        const absenceDates = new Set(absences.filter((absence) => absence.date).map((absence) => normalizeDateKey(absence.date)));
        const approvedAbsenceDates = new Set(
            absences
                .filter((absence) => absence.date && absence.status === 'approved')
                .map((absence) => normalizeDateKey(absence.date)),
        );
        const events: any[] = [];

        for (const cursor = new Date(visibleRange.start); cursor < visibleRange.end; cursor.setDate(cursor.getDate() + 1)) {
            const dateKey = toDateKey(cursor);

            if (approvedAbsenceDates.has(dateKey)) {
                continue;
            }

            (schedules || [])
                .filter((schedule) => Number(schedule.day_of_week) === getIsoWeekday(cursor))
                .forEach((schedule) => {
                    events.push({
                        id: `schedule-${dateKey}-${schedule.id ?? schedule.day_of_week}`,
                        title: `Previsto ${formatTime(schedule.start_time)}-${formatTime(schedule.end_time)}`,
                        start: `${dateKey}T${schedule.start_time}`,
                        end: `${dateKey}T${schedule.end_time}`,
                        backgroundColor: '#eff6ff',
                        textColor: '#1e40af',
                        borderColor: '#bfdbfe',
                        display: 'block',
                    });
                });
        }

        registries.forEach((registry) => {
            const hours = registry.check_out ? formatDurationFromHours((new Date(registry.check_out).getTime() - new Date(registry.check_in).getTime()) / 3600000) : 'En curso';
            const isLate = registry.status === 'late';

            events.push({
                id: `registry-${registry.id}`,
                title: registry.check_out ? `Real: ${hours}` : 'Fichaje en curso',
                start: registry.check_in,
                end: registry.check_out || liveNow,
                backgroundColor: !registry.check_out ? '#dbeafe' : isLate ? '#fef3c7' : '#d1fae5',
                textColor: !registry.check_out ? '#1d4ed8' : isLate ? '#92400e' : '#065f46',
                borderColor: !registry.check_out ? '#93c5fd' : isLate ? '#fcd34d' : '#6ee7b7',
            });
        });

        absences.forEach((absence) => {
            if (!absence.date) return;

            const statusConfig =
                absence.status === 'approved'
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
            const schedule = schedules.find((item) => Number(item.day_of_week) === getIsoWeekday(cursor));

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
    }, [absences, intern, liveNow, registries, schedules, visibleRange.end, visibleRange.start]); //[absences, intern?.end_date, intern?.start_date, liveNow, registries, schedules]);

    return (
        <Card className="overflow-hidden rounded-[32px] border-none bg-white p-8 shadow-xl">
            <style>{`
                .fc { --fc-border-color: #f1f5f9; font-family: inherit; }
                .fc .fc-toolbar-title { font-weight: 800; font-size: 1.25rem; color: #0f172a; }
                .fc .fc-button-primary { background-color: #fff; border-color: #e2e8f0; color: #64748b; font-weight: 700; text-transform: capitalize; border-radius: 12px; }
                .fc .fc-button-primary:hover { background-color: #f8fafc; border-color: #cbd5e1; color: #0f172a; }
                .fc .fc-button-active { background-color: #0f172a !important; border-color: #0f172a !important; color: #fff !important; }
                .fc .fc-event { border-radius: 8px; padding: 2px 4px; border: 1px solid transparent; }
                .fc .fc-timegrid-now-indicator-line { border-color: #ef4444; border-width: 2px 0 0; }
                .fc .fc-timegrid-now-indicator-arrow { border-top-color: #ef4444; border-bottom-color: #ef4444; }
                .fc-theme-standard td, .fc-theme-standard th { border-color: #f1f5f9; }
            `}</style>

            <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay',
                }}
                locales={[esLocale]}
                locale={esLocale}
                firstDay={1}
                buttonText={{
                    today: 'Hoy',
                    month: 'Mes',
                    week: 'Semana',
                    day: 'Día',
                }}
                allDayText="Todo el día"
                weekText="Sem."
                events={calendarEvents}
                now={liveNow}
                nowIndicator
                dateClick={(dateInfo) => {
                    dateInfo.view.calendar.changeView('timeGridDay', dateInfo.dateStr);
                }}
                datesSet={(dateInfo) => {
                    setVisibleRange((currentRange) => {
                        if (currentRange.start.getTime() === dateInfo.start.getTime() && currentRange.end.getTime() === dateInfo.end.getTime()) {
                            return currentRange;
                        }

                        return { start: dateInfo.start, end: dateInfo.end };
                    });
                }}
                height="600px"
                eventTimeFormat={{
                    hour: '2-digit',
                    minute: '2-digit',
                    meridiem: false,
                    hour12: false,
                }}
            />
        </Card>
    );
}
