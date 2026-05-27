import { Calendar as CalendarIcon, Clock } from 'lucide-react';

const dateTimeDatePart = (value: string) => value.split('T')[0] || '';
const dateTimeTimePart = (value: string) => value.split('T')[1]?.slice(0, 5) || '';

const mergeDateTimePart = (value: string, part: 'date' | 'time', nextValue: string) => {
    const date = part === 'date' ? nextValue : dateTimeDatePart(value);
    const time = part === 'time' ? nextValue : dateTimeTimePart(value);

    return date || time ? `${date}T${time}` : '';
};

export default function DateTimePickerField({
    label,
    value,
    onChange,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
}) {
    const datePart = dateTimeDatePart(value);
    const timePart = dateTimeTimePart(value);

    return (
        <div className="space-y-2">
            <label className="ml-1 text-xs font-bold uppercase tracking-wide text-slate-500">{label}</label>
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
}
