export type Period = 'weekly' | 'monthly';

export const formatDurationFromHours = (value: number | string | null | undefined) => {
    const hoursValue = Number(value || 0);
    const totalMinutes = Math.round(hoursValue * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours > 0 && minutes > 0) return `${hours} h ${minutes} min`;
    if (hours > 0) return `${hours} h`;

    return `${minutes} min`;
};

export const getRegistryWorkedHours = (registry: any, fallbackEnd: Date) => {
    if (!registry.check_in) return 0;

    const start = new Date(registry.check_in).getTime();
    const end = registry.check_out ? new Date(registry.check_out).getTime() : fallbackEnd.getTime();

    return Math.max(0, (end - start) / 3600000);
};

export const hoursBetweenTimeStrings = (dateKey: string, startTime?: string, endTime?: string) => {
    if (!startTime || !endTime) return 0;

    const start = new Date(`${dateKey}T${startTime}`);
    const end = new Date(`${dateKey}T${endTime}`);

    return Math.max(0, (end.getTime() - start.getTime()) / 3600000);
};

export const toDateKey = (date: Date) => {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');

    return `${year}-${month}-${day}`;
};

export const getIsoWeekday = (date: Date) => {
    const day = date.getDay();

    return day === 0 ? 7 : day;
};

export const formatTime = (time: string) => time?.slice(0, 5) || '--:--';

export const getAbsenceBadgeClass = (status: string) => {
    switch (status) {
        case 'approved':
            return 'bg-emerald-50 text-emerald-600 border-emerald-100';
        case 'rejected':
            return 'bg-rose-50 text-rose-600 border-rose-100';
        default:
            return 'bg-amber-50 text-amber-600 border-amber-100';
    }
};
