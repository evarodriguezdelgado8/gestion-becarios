import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    Play, Square, ArrowRight, Calendar as CalendarIcon, 
    Clock, FileText, CheckCircle2, Plus, History, LayoutDashboard, Info
} from 'lucide-react';

// FullCalendar Imports
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

interface Props {
    activeSession: any;
    registries: any[]; // Fichajes reales
    schedules: any[];  // Horarios asignados por admin
    generalProcessing: boolean;
    handleCheckIn: () => void;
    handleCheckOut: () => void;
    elapsedTime: string;
}

export default function InternDashboard({ 
    activeSession, registries, schedules, generalProcessing, handleCheckIn, handleCheckOut, elapsedTime 
}: Props) {
    
    const HORAS_TOTALES_OBJETIVO = 400; 
    
    const calcularHorasTotales = () => {
        const ms = registries.reduce((acc, reg) => {
            if (!reg.check_out) return acc;
            return acc + (new Date(reg.check_out).getTime() - new Date(reg.check_in).getTime());
        }, 0);
        return parseFloat((ms / 3600000).toFixed(1));
    };

    const horasHechas = calcularHorasTotales();
    const porcentaje = Math.min((horasHechas / HORAS_TOTALES_OBJETIVO) * 100, 100);

    // --- LÓGICA DE EVENTOS PARA EL CALENDARIO ---
    const calendarEvents = [
        // 1. Mapear horarios previstos (Admin)
        ...(schedules || []).map(s => ({
            title: `Horario: ${s.name || 'Prácticas'}`,
            start: s.start_time,
            end: s.end_time,
            backgroundColor: '#eff6ff', // Azul muy claro
            textColor: '#1e40af',
            borderColor: '#bfdbfe',
            display: 'block'
        })),
        // 2. Mapear registros reales (Fichajes)
        ...registries.map(reg => {
            const horas = reg.check_out 
                ? ((new Date(reg.check_out).getTime() - new Date(reg.check_in).getTime()) / 3600000).toFixed(1)
                : 'En curso';

            return {
                title: `Real: ${horas}h`,
                start: reg.check_in,
                end: reg.check_out || new Date(),
                backgroundColor: reg.status === 'late' ? '#fef3c7' : '#d1fae5', 
                textColor: reg.status === 'late' ? '#92400e' : '#065f46',
                borderColor: reg.status === 'late' ? '#fcd34d' : '#6ee7b7',
            };
        })
    ];

    return (
        <div className="max-w-6xl mx-auto w-full space-y-8 animate-in fade-in duration-500 pb-10">
            
            <Tabs defaultValue="dashboard" className="w-full">
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    <h2 className="text-2xl font-bold text-gray-900">Control de asistencia</h2>
                </div>

                <div  className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4"> 
                    <TabsList className="bg-slate-100 p-1 rounded-2xl h-12">
                    <TabsTrigger value="dashboard" className="rounded-xl px-6 font-bold data-[state=active]:bg-white shadow-none">
                        <LayoutDashboard className="w-4 h-4 mr-2" /> Resumen
                    </TabsTrigger>
                    <TabsTrigger value="calendar" className="rounded-xl px-6 font-bold data-[state=active]:bg-white shadow-none">
                        <CalendarIcon className="w-4 h-4 mr-2" /> Mi Horario
                    </TabsTrigger>
                    <TabsTrigger value="history" className="rounded-xl px-6 font-bold data-[state=active]:bg-white shadow-none">
                        <History className="w-4 h-4 mr-2" /> Historial
                    </TabsTrigger>
                    <TabsTrigger value="absences" className="rounded-xl px-6 font-bold data-[state=active]:bg-white shadow-none">
                        <FileText className="w-4 h-4 mr-2" /> Ausencias
                    </TabsTrigger>
                    </TabsList>
                </div>

                {/* --- TAB: RESUMEN --- */}
                <TabsContent value="dashboard" className="space-y-8 mt-0 outline-none">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="md:col-span-2 p-8 rounded-[32px] border-none shadow-xl bg-white flex flex-col justify-center">
                            <div className="flex justify-between items-end mb-4">
                                <div>
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Horas Acumuladas</p>
                                    <h2 className="text-4xl font-black text-slate-900">
                                        {horasHechas}h <span className="text-slate-300 text-xl font-medium">/ {HORAS_TOTALES_OBJETIVO}h</span>
                                    </h2>
                                </div>
                                <div className="text-right">
                                    <span className="text-2xl font-black text-blue-600">{porcentaje.toFixed(0)}%</span>
                                </div>
                            </div>
                            <Progress value={porcentaje} className="h-3 bg-slate-100" />
                            <p className="text-xs text-slate-400 mt-4 flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> 
                                Has completado {porcentaje.toFixed(0)}% de tus prácticas.
                            </p>
                        </Card>

                        <Card className={`p-8 rounded-[32px] border-none shadow-2xl transition-all ${activeSession ? 'bg-slate-900 text-white' : 'bg-white'}`}>
                            <p className={`text-[11px] font-bold uppercase tracking-widest mb-2 ${activeSession ? 'text-emerald-400' : 'text-slate-400'}`}>
                                {activeSession ? 'En Curso' : 'Turno Cerrado'}
                            </p>
                            <div className="text-4xl font-mono font-bold mb-8">
                                {activeSession ? elapsedTime : '00:00:00'}
                            </div>
                            
                            {!activeSession ? (
                                <Button onClick={handleCheckIn} disabled={generalProcessing} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-14 rounded-2xl shadow-lg">
                                    <Play className="mr-2 h-5 w-5 fill-current" /> Iniciar Ahora
                                </Button>
                            ) : (
                                <Button onClick={handleCheckOut} disabled={generalProcessing} variant="destructive" className="w-full font-bold h-14 rounded-2xl shadow-lg">
                                    <Square className="mr-2 h-5 w-5 fill-current" /> Terminar
                                </Button>
                            )}
                        </Card>
                    </div>

                    {/* Mini Horario de hoy */}
                    <Card className="p-6 rounded-[32px] border-none shadow-xl bg-white">
                        <div className="flex items-center gap-2 mb-4">
                            <Clock className="w-5 h-5 text-blue-500" />
                            <h3 className="font-bold text-slate-800">Horario previsto para hoy</h3>
                        </div>
                        <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex justify-between items-center">
                            <p className="text-sm font-medium text-blue-800 italic">No hay horario asignado para hoy o el admin no lo ha publicado.</p>
                            <Info className="w-4 h-4 text-blue-400" />
                        </div>
                    </Card>
                </TabsContent>

                {/* --- TAB: CALENDARIO INTERACTIVO --- */}
                <TabsContent value="calendar" className="mt-0 outline-none">
                    <Card className="p-8 rounded-[32px] border-none shadow-xl bg-white overflow-hidden">
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
                                right: 'dayGridMonth,timeGridWeek'
                            }}
                            locale="es"
                            events={calendarEvents}
                            height="600px"
                            eventTimeFormat={{
                                hour: '2-digit',
                                minute: '2-digit',
                                meridiem: false,
                                hour12: false
                            }}
                        />
                    </Card>
                </TabsContent>

                {/* --- TAB: HISTORIAL --- */}
                <TabsContent value="history" className="mt-0 outline-none">
                    <Card className="rounded-[32px] border-none shadow-xl overflow-hidden bg-white">
                        <div className="p-6 border-b border-slate-50 flex items-center gap-2">
                            <History className="w-5 h-5 text-slate-400" />
                            <h3 className="font-bold text-slate-800">Historial de Fichajes</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50/50">
                                    <tr className="text-left">
                                        <th className="px-8 py-4 font-bold text-slate-400 uppercase text-[10px] tracking-widest text-center">Día</th>
                                        <th className="px-8 py-4 font-bold text-slate-400 uppercase text-[10px] tracking-widest">Horario Realizado</th>
                                        <th className="px-8 py-4 font-bold text-slate-400 uppercase text-[10px] tracking-widest text-right">Estatus</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {registries.map((reg) => (
                                        <tr key={reg.id} className="hover:bg-slate-50/30 transition-colors">
                                            <td className="px-8 py-5 text-center">
                                                <span className="block font-bold text-slate-700">{new Date(reg.check_in).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
                                                <span className="text-[10px] text-slate-400 uppercase font-medium">{new Date(reg.check_in).toLocaleDateString('es-ES', { weekday: 'short' })}</span>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-3">
                                                    <span className="bg-slate-100 px-3 py-1.5 rounded-xl text-xs font-mono font-bold text-slate-600">
                                                        {new Date(reg.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                    <ArrowRight className="w-3 h-3 text-slate-300" />
                                                    <span className="bg-slate-100 px-3 py-1.5 rounded-xl text-xs font-mono font-bold text-slate-600">
                                                        {reg.check_out ? new Date(reg.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <span className={`text-[10px] font-black px-3 py-1.5 rounded-full border ${reg.status === 'late' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                                                    {reg.status === 'late' ? 'RETRASO' : 'PUNTUAL'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </TabsContent>

                {/* --- TAB: AUSENCIAS --- */}
                <TabsContent value="absences" className="mt-0 outline-none">
                    <Card className="p-6 rounded-[32px] border-none shadow-xl bg-white flex flex-col">
                        <div className="flex items-center justify-between mb-6 px-2">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-purple-500" /> Mis Ausencias
                            </h3>
                            <Button size="sm" variant="outline" className="rounded-xl border-purple-100 text-purple-600 font-bold hover:bg-purple-50">
                                <Plus className="w-4 h-4 mr-1" /> Solicitar
                            </Button>
                        </div>
                        <div className="space-y-4">
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center text-amber-500 shadow-sm border border-slate-100">
                                        <Clock className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-700">Cita Médica</p>
                                        <p className="text-[10px] text-slate-400 font-medium">Solicitado: 12 Mayo</p>
                                    </div>
                                </div>
                                <span className="text-[10px] font-black px-2 py-1 rounded-lg bg-amber-100 text-amber-600">PENDIENTE</span>
                            </div>
                        </div>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}