export const formatDurationFromHours = (value: number | string | null | undefined) => {
    const hoursValue = Number(value || 0);
    const totalMinutes = Math.round(hoursValue * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours > 0 && minutes > 0) return `${hours} h ${minutes} min`;
    if (hours > 0) return `${hours} h`;

    return `${minutes} min`;
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

export const getAbsenceBadgeClass = (status: string) => {
    switch (status) {
        case 'approved':
            return 'bg-emerald-50 text-emerald-700 border-emerald-200';
        case 'rejected':
            return 'bg-rose-50 text-rose-700 border-rose-200';
        default:
            return 'bg-amber-50 text-amber-700 border-amber-200';
    }
};
