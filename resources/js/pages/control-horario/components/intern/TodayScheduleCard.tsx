import { Clock, Info } from 'lucide-react';

import { Card } from '@/components/ui/card';

import { getIsoWeekday } from './internUtils';

interface TodayScheduleCardProps {
    schedules: any[];
}

export default function TodayScheduleCard({ schedules }: TodayScheduleCardProps) {
    const todaySchedule = (schedules || []).find((schedule) => schedule.day_of_week === getIsoWeekday(new Date()));

    return (
        <Card className="rounded-[32px] border-none bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-500" />
                <h3 className="font-bold text-slate-800">Horario previsto para hoy</h3>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-blue-100 bg-blue-50 p-4">
                <p className="text-sm font-medium italic text-blue-800">
                    {todaySchedule ? `${todaySchedule.start_time} - ${todaySchedule.end_time}` : 'No hay horario asignado para hoy o el tutor no lo ha publicado.'}
                </p>
                <Info className="h-4 w-4 text-blue-400" />
            </div>
        </Card>
    );
}
