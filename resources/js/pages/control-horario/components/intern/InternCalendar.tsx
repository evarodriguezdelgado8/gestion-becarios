import esLocale from '@fullcalendar/core/locales/es';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import { useMemo } from 'react';

import { Card } from '@/components/ui/card';

import { formatDurationFromHours, formatTime, getIsoWeekday, toDateKey } from './internUtils';

interface InternCalendarProps {
    registries: any[];
    schedules: any[];
    absences: any[];
    intern?: any;
    liveNow: Date;
}

export default function InternCalendar({ registries, schedules, absences, intern, liveNow }: InternCalendarProps) {
    const calendarEvents = useMemo(() => {
        const registryDates = new Set(registries.map((registry) => toDateKey(new Date(registry.check_in))));
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
    }, [absences, intern, liveNow, registries, schedules]); //[absences, intern?.end_date, intern?.start_date, liveNow, registries, schedules]);

    return (
        <Card className="overflow-hidden rounded-[32px] border-none bg-white p-8 shadow-xl">
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
                    right: 'dayGridMonth,timeGridWeek',
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
                    hour12: false,
                }}
            />
        </Card>
    );
}
