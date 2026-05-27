import { Calendar as CalendarIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function BulkScheduleForm({ scheduleForm, eligibleBecarios, eligibleBecarioUserIds, handleScheduleSubmit }: any) {
    const days = [
        ['1', 'Lunes'],
        ['2', 'Martes'],
        ['3', 'Miércoles'],
        ['4', 'Jueves'],
        ['5', 'Viernes'],
        ['6', 'Sábado'],
        ['7', 'Domingo'],
    ];

    return (
        <Card className="overflow-hidden rounded-3xl border-none bg-white shadow-xl">
            <div className="border-b border-slate-100 bg-gradient-to-r from-violet-50 via-white to-amber-50 p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-lg shadow-violet-100">
                            <CalendarIcon className="h-6 w-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900">Horario semanal</h2>
                            <p className="text-sm text-slate-500">Define la jornada de referencia para detectar retrasos y ausencias.</p>
                        </div>
                    </div>
                    <span className="w-fit rounded-full border border-violet-100 bg-white px-4 py-2 text-xs font-black uppercase tracking-wide text-violet-700 shadow-sm">{eligibleBecarios.length} becarios seleccionados</span>
                </div>
            </div>
            <form onSubmit={handleScheduleSubmit} className="space-y-6 p-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {days.map(([num, dia]) => (
                        <div key={num} className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 transition-colors hover:border-violet-100 hover:bg-violet-50/40">
                            <div className="mb-3 flex items-center justify-between">
                                <span className="text-sm font-black text-slate-800">{dia}</span>
                                <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${scheduleForm.data.days[num]?.start && scheduleForm.data.days[num]?.end ? 'bg-violet-100 text-violet-700' : 'bg-slate-200 text-slate-500'}`}>
                                    {scheduleForm.data.days[num]?.start && scheduleForm.data.days[num]?.end ? 'Activo' : 'Sin horario'}
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Entrada</label>
                                    <input
                                        type="time"
                                        value={scheduleForm.data.days[num]?.start || ''}
                                        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium shadow-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
                                        onChange={(e) => {
                                            const newDays = { ...scheduleForm.data.days };
                                            newDays[num] = { ...newDays[num], start: e.target.value };
                                            scheduleForm.setData('days', newDays);
                                        }}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Salida</label>
                                    <input
                                        type="time"
                                        value={scheduleForm.data.days[num]?.end || ''}
                                        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium shadow-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
                                        onChange={(e) => {
                                            const newDays = { ...scheduleForm.data.days };
                                            newDays[num] = { ...newDays[num], end: e.target.value };
                                            scheduleForm.setData('days', newDays);
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <div>
                    <Button disabled={scheduleForm.processing || eligibleBecarioUserIds.length === 0} className="h-12 rounded-2xl bg-violet-600 px-8 font-bold text-white shadow-lg shadow-violet-100 hover:bg-violet-700 float-right">
                        {scheduleForm.processing ? 'Aplicando...' : 'Aplicar horario'}
                    </Button>
                </div>
            </form>
        </Card>
    );
}
