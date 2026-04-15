import { useReducer, useState, useEffect, useMemo } from 'react';
import { Head, router, Link, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { 
    Plus, Calendar, User, 
    MessageSquare, Paperclip, Edit, Trash2,
    LayoutDashboard, List, CheckCircle2, Clock, AlertCircle, RefreshCw, XCircle
} from 'lucide-react';
import { toast } from 'sonner';

import TaskFormModal from './taskFormModal';
import DeleteTaskModal from './deleteTaskModal';
import { MultiSelect } from "@/components/ui/multi-select";
import { DatePicker } from "@/components/ui/date-picker";

type Priority = 'low' | 'medium' | 'high' | 'urgent' | '';

interface Task {
    id: number;
    title: string;
    description: string;
    status: string;
    priority: Priority;
    due_date?: string;
    intern?: { name: string; last_name: string; academic_cycle?: string };
    media?: any[];
    update_status_url: string;
    intern_id: number;
    center_id?: number;
}

interface KanbanState { [key: string]: Task[]; }

type Action = 
    | { type: 'MOVE_TASK'; payload: { source: string; destination: string; sourceIndex: number; destIndex: number } }
    | { type: 'SET_STATE'; payload: KanbanState };

const STATUS_LABELS: Record<string, string> = {
    pending: 'Pendiente',
    in_progress: 'En Progreso',
    in_review: 'En Revisión',
    completed: 'Completado',
    rejected: 'Rechazado'
};

const PRIORITY_LABELS: Record<string, string> = {
    low: 'Baja', medium: 'Media', high: 'Alta', urgent: 'Urgente'
};

const getStatusConfig = (status: string) => {
    const configs: Record<string, { shadow: string, border: string, bg: string, text: string, icon: any, borderHeader: string }> = {
        pending: { 
            bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200', 
            borderHeader: 'border-slate-300', shadow: 'shadow-slate-100', icon: Clock 
        },
        in_progress: { 
            bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200', 
            borderHeader: 'border-blue-300', shadow: 'shadow-blue-100', icon: RefreshCw 
        },
        in_review: { 
            bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200', 
            borderHeader: 'border-purple-300', shadow: 'shadow-purple-100', icon: AlertCircle 
        },
        completed: { 
            bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200', 
            borderHeader: 'border-green-300', shadow: 'shadow-green-100', icon: CheckCircle2 
        },
        rejected: { 
            bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200', 
            borderHeader: 'border-red-300', shadow: 'shadow-red-100', icon: XCircle 
        },
    };
    return configs[status] || configs.pending;
};

function kanbanReducer(state: KanbanState, action: Action): KanbanState {
    switch (action.type) {
        case 'MOVE_TASK': {
            const { source, destination, sourceIndex, destIndex } = action.payload;
            if (source === destination) return state;

            const sourceCol = [...(state[source] || [])];
            const destCol = [...(state[destination] || [])];
            const [movedTask] = sourceCol.splice(sourceIndex, 1);
            const updatedTask = { ...movedTask, status: destination };
            destCol.splice(destIndex, 0, updatedTask);

            return { ...state, [source]: sourceCol, [destination]: destCol };
        }
        case 'SET_STATE': return action.payload;
        default: return state;
    }
}

interface Props {
    kanban: KanbanState;
    interns: any[];
    centers: any[];
    filters: {
        search?: string;
        intern_id?: string;
        center_id?: string;
        priority?: string;
        academic_cycle?: string;
        due_date?: string;
    };
}

export default function Index({ kanban = {}, interns = [], centers = [], filters }: Props) {
    const { auth } = usePage().props as any;
    const isBecario = auth?.user?.roles?.some((r: any) => (typeof r === 'object' ? r.name : r)?.toLowerCase().includes('intern')) ?? false;

    const [state, dispatch] = useReducer(kanbanReducer, kanban);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [initialStatus, setInitialStatus] = useState<string>('pending');
    const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
    const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [selectedInterns, setSelectedInterns] = useState<string[]>(filters.intern_id ? filters.intern_id.split(',') : []);
    const [selectedCenters, setSelectedCenters] = useState<string[]>(filters.center_id ? filters.center_id.split(',') : []);
    const [selectedPriorities, setSelectedPriorities] = useState<string[]>(filters.priority ? filters.priority.split(',') : []);
    const [selectedCycles, setSelectedCycles] = useState<string[]>(filters.academic_cycle ? filters.academic_cycle.split(',') : []);
    const [selectedDate, setSelectedDate] = useState(filters.due_date || '');

    useEffect(() => {
        dispatch({ type: 'SET_STATE', payload: kanban });
    }, [kanban]);

    useEffect(() => {
        setSearchQuery(filters.search || '');
        setSelectedInterns(filters.intern_id ? filters.intern_id.split(',') : []);
        setSelectedCenters(filters.center_id ? filters.center_id.split(',') : []);
        setSelectedPriorities(filters.priority ? filters.priority.split(',') : []);
        setSelectedCycles(filters.academic_cycle ? filters.academic_cycle.split(',') : []);
        setSelectedDate(filters.due_date || '');
    }, [filters]);

    useEffect(() => {
        const timeout = setTimeout(() => {
            if (searchQuery !== (filters.search || '')) {
                applyFilters({ search: searchQuery });
            }
        }, 500);
    
        return () => clearTimeout(timeout);
    }, [searchQuery]);


    const applyFilters = (overrides = {}) => {
        const params = {
            search: searchQuery,
            intern_id: overrides.hasOwnProperty('intern_id') ? overrides.intern_id : (selectedInterns.length > 0 ? selectedInterns.join(',') : null),
            center_id: overrides.hasOwnProperty('center_id') ? overrides.center_id : (selectedCenters.length > 0 ? selectedCenters.join(',') : null),
            priority: overrides.hasOwnProperty('priority') ? overrides.priority : (selectedPriorities.length > 0 ? selectedPriorities.join(',') : null),
            academic_cycle: overrides.hasOwnProperty('academic_cycle') ? overrides.academic_cycle : (selectedCycles.length > 0 ? selectedCycles.join(',') : null),
            due_date: selectedDate,
            ...overrides 
        };
    
        const cleanParams = Object.fromEntries(
            Object.entries(params).filter(([_, v]) => v !== "" && v !== null && v !== undefined)
        );
    
        router.get('/tareas', cleanParams as any, { 
            preserveState: true, 
            replace: true,
            preserveScroll: true
        });
    };
    
    const clearFilters = () => {
        setSearchQuery('');
        setSelectedInterns([]);
        setSelectedCenters([]);
        setSelectedPriorities([]);
        setSelectedCycles([]);
        setSelectedDate('');
    
        router.get('/tareas', {}, { 
            replace: true,
            preserveState: false
        });
    };

    

    const allTasks = useMemo(() => Object.values(state).flat(), [state]);

    const getPriorityStyle = (priority: string) => {
        const styles: Record<string, string> = {
            urgent: 'bg-red-100 text-red-700 border-red-200',
            high: 'bg-orange-100 text-orange-700 border-orange-200',
            medium: 'bg-blue-100 text-blue-700 border-blue-200',
            low: 'bg-gray-100 text-gray-700 border-gray-200'
        };
        return styles[priority] || styles.low;
    };

    const isDateUrgent = (dateStr: string | undefined) => {
        if (!dateStr) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const due = new Date(dateStr);
        due.setHours(0, 0, 0, 0);
        const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays <= 2;
    };

    const formatDateSpanish = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('es-ES', {
            day: '2-digit', month: '2-digit', year: 'numeric'
        });
    };

    const handleCreate = (status: string = 'pending') => {
        setSelectedTask(null);
        setInitialStatus(status);
        setIsFormOpen(true);
    };

    const handleEdit = (task: Task) => {
        setSelectedTask(task);
        setIsFormOpen(true);
    };

    const handleDeleteClick = (task: Task) => {
        setSelectedTask(task);
        setIsDeleteOpen(true);
    };

    // --- MANEJADORES DRAG & DROP NATIVO ---
    const handleDragStart = (e: React.DragEvent, task: Task, sourceCol: string, index: number) => {
        e.dataTransfer.setData("taskId", task.id.toString());
        e.dataTransfer.setData("sourceCol", sourceCol);
        e.dataTransfer.setData("sourceIndex", index.toString());
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e: React.DragEvent, columnId: string) => {
        e.preventDefault();
        if (dragOverColumn !== columnId) setDragOverColumn(columnId);
    };

    const handleDrop = (e: React.DragEvent, destinationCol: string) => {
        e.preventDefault();
        setDragOverColumn(null);

        const taskId = e.dataTransfer.getData("taskId");
        const sourceCol = e.dataTransfer.getData("sourceCol");
        const sourceIndex = parseInt(e.dataTransfer.getData("sourceIndex"));

        if (sourceCol === destinationCol) return;

        const taskToMove = state[sourceCol][sourceIndex];

        dispatch({
            type: 'MOVE_TASK',
            payload: {
                source: sourceCol,
                destination: destinationCol,
                sourceIndex: sourceIndex,
                destIndex: 0
            }
        });

        router.patch(taskToMove.update_status_url, {
            status: destinationCol,
            new_index: 0
        }, {
            preserveScroll: true,
            onError: () => {
                dispatch({ type: 'SET_STATE', payload: kanban });
                toast.error('Error al actualizar el estado');
            }
        });
    };

    const cycleOptions = [
        { label: "DAM", value: "dam" },
        { label: "DAW", value: "daw" },
        { label: "ASIR", value: "asir" },
    ];

    return (
        <AppLayout breadcrumbs={[{ title: 'Tareas', href: '/tareas' }]}>
            <Head title={`Tareas - ${viewMode === 'kanban' ? 'Tablero' : 'Lista'}`} />

            <div className="p-6 flex flex-col h-screen max-h-[calc(100vh-65px)]">
                <div className="flex justify-between items-center mb-6 shrink-0">
                    <h1 className="text-2xl font-bold text-gray-900">Gestión de Tareas</h1>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
                            <button onClick={() => setViewMode('kanban')} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'kanban' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}><LayoutDashboard size={16} /> Kanban</button>
                            <button onClick={() => setViewMode('list')} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}><List size={16} /> Lista</button>
                        </div>
                        {!isBecario && (
                            <button onClick={() => handleCreate('pending')} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-sm font-medium"><Plus size={18} /> Nueva Tarea</button>
                        )}
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
                        {/* Búsqueda por Título */}
                        <div className="relative">
                            <input 
                                type="text"
                                placeholder="Buscar por título..."
                                className="w-full pl-3 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {/* Filtro Alumno */}
                        <MultiSelect 
                            options={interns.map(i => ({ label: `${i.name} ${i.last_name}`, value: i.id.toString() }))} 
                            selected={selectedInterns} 
                            onChange={(values) => {
                                setSelectedInterns(values);
                                applyFilters({ intern_id: values.length > 0 ? values.join(',') : null });
                            }} 
                            placeholder="Alumnos"
                        />

                        {/* Filtro Prioridad */}
                        <MultiSelect 
                            options={[
                                { label: 'Baja', value: 'low' },
                                { label: 'Media', value: 'medium' },
                                { label: 'Alta', value: 'high' },
                                { label: 'Urgente', value: 'urgent' }
                            ]} 
                            selected={selectedPriorities} 
                            onChange={(values) => {
                                setSelectedPriorities(values);
                                applyFilters({ priority: values.length > 0 ? values.join(',') : null });
                            }} 
                            placeholder="Prioridades"
                        />

                        {/* Filtro Centro */}
                        <MultiSelect 
                            options={centers.map(c => ({ label: c.name, value: c.id.toString() }))} 
                            selected={selectedCenters} 
                            onChange={(values) => {
                                setSelectedCenters(values);
                                applyFilters({ center_id: values.length > 0 ? values.join(',') : null });
                            }} 
                            placeholder="Centros"
                        />
                       
                        
                        <div>
                            <MultiSelect 
                                options={cycleOptions} 
                                selected={selectedCycles} 
                                onChange={(values) => {
                                    setSelectedCycles(values);
                                    // Pasamos los valores unidos por coma para la URL
                                    applyFilters({ academic_cycle: values.length > 0 ? values.join(',') : null });
                                }} 
                                placeholder="Todos los ciclos"
                            />
                        </div>

                        {/* Filtro Fecha Límite */}
                        <div className="flex flex-col">
                            <DatePicker 
                                date={selectedDate} 
                                onChange={(isoDate) => {
                                    const val = isoDate || '';
                                    setSelectedDate(val);
                                    applyFilters({ due_date: val });
                                }} 
                                className="w-full bg-slate-50 border-slate-200 rounded-lg text-sm"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button 
                            onClick={clearFilters}
                            className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-red-600 transition-colors"
                        >
                            <Trash2 size={14} /> Borrar todos los filtros
                        </button>
                    </div>
                </div>
                
                {viewMode === 'kanban' ? (
                    <div className="flex gap-4 overflow-x-auto pb-4 flex-1 min-h-0 items-start">
                        {Object.entries(state).map(([columnId, tasks]) => {
                            const config = getStatusConfig(columnId);
                            return (
                                <div 
                                    key={columnId} 
                                    onDragOver={(e) => handleDragOver(e, columnId)}
                                    onDrop={(e) => handleDrop(e, columnId)}
                                    onDragLeave={() => setDragOverColumn(null)}
                                    className={`w-80 flex-shrink-0 bg-slate-50/50 rounded-xl border flex flex-col max-h-full overflow-hidden shadow-sm transition-all ${dragOverColumn === columnId ? 'border-blue-400 ring-2 ring-blue-500/10 bg-blue-50/30' : 'border-slate-200'}`}
                                >
                                    <div className={`p-3 border-b ${config.borderHeader} ${config.bg} flex justify-between items-center shrink-0`}>
                                        <div className="flex items-center gap-2">
                                            <config.icon size={14} className={config.text} />
                                            <h3 className={`font-bold text-[11px] uppercase tracking-wider ${config.text}`}>
                                                {STATUS_LABELS[columnId]}
                                            </h3>
                                        </div>
                                        <span className={`${config.text} bg-white/50 text-[10px] px-2 py-0.5 rounded-md font-bold border border-current/10`}>
                                            {tasks.length}
                                        </span>
                                    </div>

                                    <div className="p-3 overflow-y-auto flex-1 min-h-[150px]">
                                        {tasks.map((task, index) => (
                                            <div 
                                                key={task.id}
                                                draggable
                                                onDragStart={(e) => handleDragStart(e, task, columnId, index)}
                                                className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm mb-3 cursor-grab active:cursor-grabbing hover:border-blue-400 hover:shadow-md transition-all group"
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${getPriorityStyle(task.priority)}`}>
                                                        {PRIORITY_LABELS[task.priority]}
                                                    </div>
                                                    {!isBecario && (
                                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button onClick={() => handleEdit(task)} className="p-1 text-slate-400 hover:text-blue-600 rounded"><Edit size={14} /></button>
                                                            <button onClick={() => handleDeleteClick(task)} className="p-1 text-slate-400 hover:text-red-600 rounded"><Trash2 size={14} /></button>
                                                        </div>
                                                    )}
                                                </div>
                                                <Link href={`/tareas/${task.id}`} className="block mb-2">
                                                    <h4 className="text-sm font-bold text-slate-800 hover:text-blue-700 line-clamp-2">{task.title}</h4>
                                                </Link>
                                                <div className="flex items-center gap-1.5 text-[12px] text-slate-500 mb-4">
                                                    <User size={12} />
                                                    <span className="truncate">{task.intern?.name ? `${task.intern.name} ${task.intern.last_name}` : 'Sin asignar'}</span>
                                                </div>
                                                <div className="flex justify-between items-center border-t border-slate-50 pt-3">
                                                    <div className="flex gap-3 text-slate-400">
                                                        <div className="flex items-center gap-1"><MessageSquare size={12}/><span className="text-[10px]">0</span></div>
                                                        <div className="flex items-center gap-1"><Paperclip size={12}/><span className="text-[10px]">{task.media?.length || 0}</span></div>
                                                    </div>
                                                    {task.due_date && (
                                                        <div className={`text-[11px] font-bold px-2 py-0.5 rounded flex items-center gap-1 ${isDateUrgent(task.due_date) ? 'bg-red-100 text-red-600' : 'bg-slate-50 text-slate-600'}`}>
                                                            <Calendar size={10} /> {formatDateSpanish(task.due_date)}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex-1 overflow-hidden bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
                        <div className="overflow-y-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 sticky top-0 z-10">
                                    <tr>
                                        <th className="p-4 text-xs font-bold uppercase text-slate-500 border-b">Tarea</th>
                                        <th className="p-4 text-xs font-bold uppercase text-slate-500 border-b">Estado</th>
                                        <th className="p-4 text-xs font-bold uppercase text-slate-500 border-b">Becario</th>
                                        <th className="p-4 text-xs font-bold uppercase text-slate-500 border-b">Prioridad</th>
                                        <th className="p-4 text-xs font-bold uppercase text-slate-500 border-b">Vencimiento</th>
                                        <th className="p-4 text-xs font-bold uppercase text-slate-500 border-b text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {allTasks.map((task) => {
                                        const config = getStatusConfig(task.status);
                                        const StatusIcon = config.icon;
                                        return (
                                            <tr key={task.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="p-4">
                                                    <Link href={`/tareas/${task.id}`} className="font-semibold text-slate-800 hover:text-blue-600 block">{task.title}</Link>
                                                    <span className="text-xs text-slate-400 line-clamp-1">{task.description}</span>
                                                </td>
                                                <td className="p-4">
                                                    <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border shadow-sm ${config.bg} ${config.text} ${config.border}`}>
                                                        <StatusIcon size={12} className="opacity-70" />
                                                        {STATUS_LABELS[task.status]}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-sm text-slate-600">
                                                    <div className="flex items-center gap-2"><User size={14} className="text-slate-400" />{task.intern ? `${task.intern.name} ${task.intern.last_name}` : 'Sin asignar'}</div>
                                                </td>
                                                <td className="p-4">
                                                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${getPriorityStyle(task.priority)}`}>{PRIORITY_LABELS[task.priority]}</span>
                                                </td>
                                                <td className="p-4">
                                                    {task.due_date ? (
                                                        <div className={`text-sm flex items-center gap-1.5 ${isDateUrgent(task.due_date) ? 'text-red-600 font-bold' : 'text-slate-500'}`}><Calendar size={14} /> {formatDateSpanish(task.due_date)}</div>
                                                    ) : '-'}
                                                </td>
                                                <td className="p-4 text-right">
                                                    {!isBecario && (
                                                        <div className="flex justify-end gap-1">
                                                            <button onClick={() => handleEdit(task)} className="p-1.5 text-slate-400 hover:text-blue-600 rounded-md"><Edit size={16} /></button>
                                                            <button onClick={() => handleDeleteClick(task)} className="p-1.5 text-slate-400 hover:text-red-600 rounded-md"><Trash2 size={16} /></button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                <TaskFormModal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} task={selectedTask} initialStatus={initialStatus} interns={interns} centers={centers}/>
                <DeleteTaskModal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} task={selectedTask} />
            </div>
        </AppLayout>
    );
}