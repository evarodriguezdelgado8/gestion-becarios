import { Head, useForm, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ChevronLeft, Clock, CalendarDays } from 'lucide-react';
// Importamos tus rutas manuales
import { controlHorario } from '@/routes';

const DAYS = [
    { id: 1, name: 'Lunes' },
    { id: 2, name: 'Martes' },
    { id: 3, name: 'Miércoles' },
    { id: 4, name: 'Jueves' },
    { id: 5, name: 'Viernes' },
    { id: 6, name: 'Sábado' },
    { id: 7, name: 'Domingo' }
];

export default function ConfigurarHorario({ intern, currentSchedules }: any) {
    const breadcrumbs = [
        { title: 'Control Horario', href: controlHorario().url },
        { title: `Horario: ${intern.name}`, href: '#' }
    ];

    const { data, setData, post, processing } = useForm({
        schedules: DAYS.map((day) => {
            const existing = currentSchedules.find((s: any) => s.day_of_week === day.id);
            return {
                day_of_week: day.id,
                start_time: existing?.start_time || '09:00',
                end_time: existing?.end_time || '14:00',
                enabled: !!existing
            };
        })
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Usamos la URL manual para el POST
        post(`/control-horario/configurar/${intern.id}`);
    };

    const updateDay = (index: number, field: string, value: any) => {
        const newSchedules = [...data.schedules];
        newSchedules[index] = { ...newSchedules[index], [field]: value };
        setData('schedules', newSchedules);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Configurar Horario - ${intern.name}`} />
            
            <div className="flex flex-1 flex-col gap-6 p-6 max-w-3xl mx-auto">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="bg-blue-100 p-3 rounded-xl text-blue-600">
                            <CalendarDays className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">Horario Semanal</h1>
                            <p className="text-slate-500 text-sm">Gestiona la jornada de {intern.name}</p>
                        </div>
                    </div>
                    <Link href={controlHorario().url}>
                        <Button variant="outline" size="sm" className="rounded-xl">
                            <ChevronLeft className="w-4 h-4 mr-1" /> Volver
                        </Button>
                    </Link>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {data.schedules.map((day, index) => (
                        <Card key={day.day_of_week} className={`p-4 border-2 transition-all ${day.enabled ? 'border-blue-100 bg-white' : 'border-transparent bg-slate-50 opacity-60'}`}>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <input 
                                        type="checkbox" 
                                        className="h-5 w-5 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                        checked={day.enabled}
                                        onChange={(e) => updateDay(index, 'enabled', e.target.checked)}
                                    />
                                    <span className={`text-base font-bold w-24 ${day.enabled ? 'text-slate-900' : 'text-slate-400'}`}>
                                        {DAYS[index].name}
                                    </span>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="relative group">
                                        <Clock className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${day.enabled ? 'text-blue-500' : 'text-slate-400'}`} />
                                        <Input 
                                            type="time" 
                                            className="pl-9 w-36 rounded-xl border-slate-200"
                                            disabled={!day.enabled}
                                            value={day.start_time}
                                            onChange={e => updateDay(index, 'start_time', e.target.value)}
                                        />
                                    </div>
                                    <span className="text-slate-400 font-medium">a</span>
                                    <div className="relative group">
                                        <Clock className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${day.enabled ? 'text-blue-500' : 'text-slate-400'}`} />
                                        <Input 
                                            type="time" 
                                            className="pl-9 w-36 rounded-xl border-slate-200"
                                            disabled={!day.enabled}
                                            value={day.end_time}
                                            onChange={e => updateDay(index, 'end_time', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}

                    <div className="pt-6">
                        <Button 
                            type="submit" 
                            disabled={processing} 
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-2xl h-14 text-lg font-bold transition-all active:scale-[0.98]"
                        >
                            {processing ? 'Guardando...' : 'Guardar Horario'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}