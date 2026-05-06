import { Head, useForm, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MultiSelect } from '@/components/ui/multi-select';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Asegúrate de tener este componente
import { Play, Square, Clock, ArrowRight, X, Edit3, Calendar, Users, ListFilter, History} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import InternDashboard from './internIndex';

interface Props {
    activeSession: any;
    registries: any[];
    schedules?: any[];
    becarios?: any[];
    role: 'intern' | 'manager';
    centers?: any[];
    allInterns?: any[];
    cycleOptions?: any[];
    filters?: any;
}

interface DaySchedule {
    start: string;
    end: string;
}

interface ScheduleDays {
    [key: string]: DaySchedule;
}

export default function ControlHorario({ 
    activeSession, registries, schedules = [], becarios = [], role, centers = [], allInterns = [], cycleOptions = [], filters = {} 
}: Props) {
    const breadcrumbs = [{ title: 'Control Horario', href: '/control-horario' }];
    
    const { post: generalPost, patch: generalPatch, processing: generalProcessing } = useForm();
    
    const manualForm = useForm({
        user_ids: [] as number[],
        check_in: '',
        check_out: '',
        note: ''
    });

    const scheduleForm = useForm<{user_ids: number[], days: ScheduleDays}>({
        user_ids: [],
        days: {
            '1': { start: '', end: '' },
            '2': { start: '', end: '' },
            '3': { start: '', end: '' },
            '4': { start: '', end: '' },
            '5': { start: '', end: '' },
        }
    });

    const [selectedInterns, setSelectedInterns] = useState(filters.intern_id ? filters.intern_id.split(',') : []);
    const [selectedCenters, setSelectedCenters] = useState(filters.center_id ? filters.center_id.split(',') : []);
    const [selectedCycles, setSelectedCycles] = useState(filters.academic_cycle ? filters.academic_cycle.split(',') : []);
    const [elapsedTime, setElapsedTime] = useState('00:00:00');

    const hasActiveFilters = selectedInterns.length > 0 || selectedCenters.length > 0 || selectedCycles.length > 0;

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (activeSession) {
            const calculateElapsed = () => {
                const start = new Date(activeSession.check_in).getTime();
                const now = new Date().getTime();
                const diff = now - start;
                const h = Math.floor(diff / 3600000).toString().padStart(2, '0');
                const m = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
                const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
                setElapsedTime(`${h}:${m}:${s}`);
            };
            calculateElapsed();
            interval = setInterval(calculateElapsed, 1000);
        }
        return () => clearInterval(interval);
    }, [activeSession]);

    const handleCheckIn = () => generalPost('/control-horario/check-in');
    const handleCheckOut = () => {
        if (activeSession) generalPatch(`/control-horario/${activeSession.id}/check-out`);
    };

    const applyFilters = (newFilters: any) => {
        const params: any = {
            intern_id: selectedInterns.join(','),
            center_id: selectedCenters.join(','),
            academic_cycle: selectedCycles.join(','),
            ...newFilters
        };
        Object.keys(params).forEach(key => !params[key] && delete params[key]);
        router.get('/control-horario', params, { preserveState: true, replace: true });
    };

    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        manualForm.transform((data) => ({
            ...data,
            user_ids: becarios.map(b => b.user_id)
        }));
        manualForm.post('/control-horario/manual', {
            onSuccess: () => { manualForm.reset(); toast.success("Registros creados correctamente"); },
            onError: () => toast.error("Error al crear los registros")
        });
    };

    const handleScheduleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        scheduleForm.transform((data) => ({
            user_ids: becarios.map(b => b.user_id),
            schedules: data.days
        }));
        scheduleForm.post('/control-horario/bulk-schedule', {
            onSuccess: () => toast.success("Horarios actualizados correctamente"),
            onError: () => toast.error("Error al actualizar horarios")
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Control Horario" />
            <div className="p-6 max-w-7xl mx-auto w-full space-y-8">
                
                {/* --- VISTA MANAGER --- */}
                {role === 'manager' && (
                    <>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Control de asistencia</h1>
                                <p className="text-slate-500">Panel administrativo para control de asistencia y horarios.</p>
                            </div>
                            {hasActiveFilters && (
                                <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-2xl border border-blue-100 shadow-sm text-blue-700 font-bold text-sm">
                                    <Users className="w-4 h-4" /> {becarios.length} Seleccionados
                                </div>
                            )}
                        </div>

                        <Card className="p-5 border-none shadow-xl bg-white rounded-3xl">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold uppercase text-slate-400 ml-1">Alumno</label>
                                    <MultiSelect options={allInterns.map(i => ({ label: `${i.name} ${i.last_name}`, value: i.id.toString() }))} selected={selectedInterns} onChange={(v) => { setSelectedInterns(v); applyFilters({ intern_id: v.join(',') }); }} placeholder="Buscar alumnos..." />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold uppercase text-slate-400 ml-1">Centro</label>
                                    <MultiSelect options={centers.map(c => ({ label: c.name, value: c.id.toString() }))} selected={selectedCenters} onChange={(v) => { setSelectedCenters(v); applyFilters({ center_id: v.join(',') }); }} placeholder="Todos los centros" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold uppercase text-slate-400 ml-1">Ciclo</label>
                                    <MultiSelect options={cycleOptions} selected={selectedCycles} onChange={(v) => { setSelectedCycles(v); applyFilters({ academic_cycle: v.join(',') }); }} placeholder="Cualquier ciclo" />
                                </div>
                                <Button variant="ghost" onClick={() => router.get('/control-horario')} className="text-slate-400 hover:text-red-500 rounded-xl h-10">
                                    <X className="w-4 h-4 mr-2" /> Limpiar filtros
                                </Button>
                            </div>
                        </Card>

                        {!hasActiveFilters ? (
                            <div className="py-20 text-center bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200">
                                <ListFilter className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                <h3 className="text-lg font-bold text-slate-700">Comienza filtrando becarios</h3>
                                <p className="text-slate-400">Usa los filtros superiores para ver asistencias o realizar cambios.</p>
                            </div>
                        ) : (
                            <Tabs defaultValue="asistencia" className="w-full space-y-6">
                                <TabsList className="bg-slate-100 p-1.5 rounded-2xl w-full md:w-auto grid grid-cols-3 md:inline-flex h-auto">
                                    <TabsTrigger value="asistencia" className="rounded-xl py-2 px-6 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                        <History className="w-4 h-4 mr-2" /> Asistencias
                                    </TabsTrigger>
                                    <TabsTrigger value="manual" className="rounded-xl py-2 px-6 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                        <Edit3 className="w-4 h-4 mr-2" /> Registro Manual
                                    </TabsTrigger>
                                    <TabsTrigger value="horario" className="rounded-xl py-2 px-6 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                        <Calendar className="w-4 h-4 mr-2" /> Horarios
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="asistencia" className="animate-in fade-in duration-300">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {becarios.map((becario: any) => (
                                            <Card key={becario.id} className="p-5 border-none shadow-sm bg-white rounded-3xl group hover:shadow-lg transition-all">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center font-bold text-slate-500 border border-slate-200 capitalize group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                                        {becario.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-slate-900 leading-tight">{becario.name} {becario.last_name}</h4>
                                                        <p className="text-xs text-slate-400 mt-1">{becario.center?.name || 'Sin centro'}</p>
                                                    </div>
                                                </div>
                                                <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hoy</span>
                                                    <span className="text-[10px] font-black px-2 py-1 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">PUNTUAL</span>
                                                </div>
                                            </Card>
                                        ))}
                                    </div>
                                </TabsContent>

                                <TabsContent value="manual" className="animate-in fade-in duration-300">
                                    <Card className="max-w-2xl mx-auto overflow-hidden border-none shadow-2xl rounded-[32px] bg-white">
                                        <div className="p-8 bg-slate-900 text-white flex items-center gap-4">
                                            <div className="p-3 bg-blue-500 rounded-2xl"><Edit3 className="w-6 h-6" /></div>
                                            <div>
                                                <h2 className="text-lg font-bold">Añadir Registro Manual</h2>
                                                <p className="text-xs text-slate-400 tracking-widest uppercase">{becarios.length} Alumnos afectados</p>
                                            </div>
                                        </div>
                                        <form onSubmit={handleManualSubmit} className="p-8 space-y-6">
                                            <div className="grid grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-slate-600 ml-1">Hora Entrada</label>
                                                    <input type="datetime-local" required className="w-full border-slate-200 rounded-2xl text-sm" onChange={e => manualForm.setData('check_in', e.target.value)} />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-slate-600 ml-1">Hora Salida</label>
                                                    <input type="datetime-local" required className="w-full border-slate-200 rounded-2xl text-sm" onChange={e => manualForm.setData('check_out', e.target.value)} />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-600 ml-1">Observación</label>
                                                <textarea className="w-full border-slate-200 rounded-2xl text-sm min-h-[100px]" placeholder="Ej: Olvido de fichaje..." onChange={e => manualForm.setData('note', e.target.value)} />
                                            </div>
                                            <Button disabled={manualForm.processing} className="w-full py-7 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-xl">
                                                {manualForm.processing ? 'Guardando...' : 'Registrar Jornada'}
                                            </Button>
                                        </form>
                                    </Card>
                                </TabsContent>

                                <TabsContent value="horario" className="animate-in fade-in duration-300">
                                    <Card className="max-w-2xl mx-auto overflow-hidden border-none shadow-2xl rounded-[32px] bg-white">
                                        <div className="p-8 bg-indigo-900 text-white flex items-center gap-4">
                                            <div className="p-3 bg-indigo-500 rounded-2xl"><Calendar className="w-6 h-6" /></div>
                                            <div>
                                                <h2 className="text-lg font-bold">Horario Semanal</h2>
                                                <p className="text-xs text-indigo-300 tracking-widest uppercase">Para {becarios.length} Alumnos</p>
                                            </div>
                                        </div>
                                        <form onSubmit={handleScheduleSubmit} className="p-8 space-y-3">
                                            {Object.entries({ '1': 'Lunes', '2': 'Martes', '3': 'Miércoles', '4': 'Jueves', '5': 'Viernes' }).map(([num, dia]) => (
                                                <div key={num} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                                    <span className="text-sm font-bold text-slate-700">{dia}</span>
                                                    <div className="flex gap-3">
                                                        <input type="time" className="border-slate-200 rounded-xl text-xs bg-white" onChange={e => {
                                                            const newDays = { ...scheduleForm.data.days };
                                                            newDays[num] = { ...newDays[num], start: e.target.value };
                                                            scheduleForm.setData('days', newDays);
                                                        }} />
                                                        <input type="time" className="border-slate-200 rounded-xl text-xs bg-white" onChange={e => {
                                                            const newDays = { ...scheduleForm.data.days };
                                                            newDays[num] = { ...newDays[num], end: e.target.value };
                                                            scheduleForm.setData('days', newDays);
                                                        }} />
                                                    </div>
                                                </div>
                                            ))}
                                            <Button disabled={scheduleForm.processing} className="w-full py-7 mt-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-xl shadow-indigo-100">
                                                {scheduleForm.processing ? 'Aplicando...' : 'Aplicar Horario'}
                                            </Button>
                                        </form>
                                    </Card>
                                </TabsContent>
                            </Tabs>
                        )}
                    </>
                )}

                {/* --- VISTA BECARIO --- */}
                {role === 'intern' && (
                    <InternDashboard 
                        activeSession={activeSession}
                        registries={registries}
                        schedules={schedules}
                        generalProcessing={generalProcessing}
                        handleCheckIn={handleCheckIn}
                        handleCheckOut={handleCheckOut}
                        elapsedTime={elapsedTime}
                    />
                )}
            </div>
        </AppLayout>
    );
}