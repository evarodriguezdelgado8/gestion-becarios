import { Head, router, usePage } from '@inertiajs/react';
import { Plus, Trash2, LayoutDashboard, List } from 'lucide-react';
import { useReducer, useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import {
    DndContext,
    closestCenter,
    pointerWithin,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';

import DeleteConfirmModal from '@/components/common/DeleteConfirmModal';
import { DatePicker } from "@/components/ui/date-picker";
import { MultiSelect } from "@/components/ui/multi-select";
import AppLayout from '@/layouts/app-layout';

import KanbanColumn from './components/kanbanColumn';
import TaskTableRow from './components/taskTableRow';
import TaskFormModal from './taskFormModal';
import { kanbanReducer, getPriorityStyle, PRIORITY_LABELS } from './taskUtils';

export default function Index({ kanban = {}, interns = [], centers = [], filters }: any) {
    const { auth } = usePage().props as any;
    const isBecario = auth?.user?.roles?.some((r: any) => 
        (typeof r === 'object' ? r.name : r)?.toLowerCase().includes('intern')
    ) ?? false;

    const [state, dispatch] = useReducer(kanbanReducer, kanban);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<any | null>(null);
    const [activeTask, setActiveTask] = useState<any | null>(null);
    const [initialStatus, setInitialStatus] = useState<string>('pending');
    const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

    // 1. OBTENER CICLOS ÚNICOS DE LOS BECARIOS (Como no hay tabla, los sacamos de los alumnos)
    const cycleOptions = useMemo(() => {
        const uniqueCycles = Array.from(new Set(interns.map((i: any) => i.academic_cycle).filter(Boolean)));
        return uniqueCycles.map(cycle => ({ label: String(cycle), value: String(cycle) }));
    }, [interns]);

    // ESTADOS DE FILTROS (Unificados con el backend)
    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [selectedInterns, setSelectedInterns] = useState<string[]>(filters.intern_id ? filters.intern_id.split(',') : []);
    const [selectedPriorities, setSelectedPriorities] = useState<string[]>(filters.priority ? filters.priority.split(',') : []);
    const [selectedDate, setSelectedDate] = useState(filters.due_date || '');
    const [selectedCenters, setSelectedCenters] = useState<string[]>(filters.center_id ? filters.center_id.split(',') : []);
    const [selectedCycles, setSelectedCycles] = useState<string[]>(filters.academic_cycle ? filters.academic_cycle.split(',') : []);

    useEffect(() => { dispatch({ type: 'SET_STATE', payload: kanban }); }, [kanban]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const collisionDetectionStrategy = (args: any) => {
        const pointerCollisions = pointerWithin(args);
        if (pointerCollisions.length > 0) return pointerCollisions;
        return closestCenter(args); 
    };

    const applyFilters = (overrides = {}) => {
        const params = {
            search: searchQuery,
            intern_id: selectedInterns.length > 0 ? selectedInterns.join(',') : null,
            priority: selectedPriorities.length > 0 ? selectedPriorities.join(',') : null,
            due_date: selectedDate,
            center_id: selectedCenters.length > 0 ? selectedCenters.join(',') : null,
            academic_cycle: selectedCycles.length > 0 ? selectedCycles.join(',') : null, // Nombre exacto que espera el controlador
            ...overrides
        };
        const cleanParams = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== "" && v !== null));
        router.get('/tareas', cleanParams as any, { preserveState: true, replace: true, preserveScroll: true });
    };

    const clearFilters = () => {
        setSearchQuery(''); setSelectedInterns([]); setSelectedPriorities([]); 
        setSelectedDate(''); setSelectedCenters([]); setSelectedCycles([]);
        router.get('/tareas', {}, { replace: true, preserveState: false });
    };

    const handleDragStart = (event: any) => { setActiveTask(event.active.data.current.task); };

    const handleDragEnd = (event: any) => {
        const { active, over } = event;
        setActiveTask(null);
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;
        const sourceCol = active.data.current.columnId;
        const destinationCol = over.data.current?.columnId || overId;

        if (!state[destinationCol]) return;

        const sourceTasks = state[sourceCol];
        const destTasks = state[destinationCol];
        const sourceIndex = sourceTasks.findIndex((t: any) => t.id === activeId);
        let destIndex = destTasks.findIndex((t: any) => t.id === overId);
        
        if (destIndex === -1) destIndex = destTasks.length;
        if (sourceCol === destinationCol && sourceIndex === destIndex) return;

        dispatch({ 
            type: 'MOVE_TASK', 
            payload: { source: sourceCol, destination: destinationCol, sourceIndex, destIndex } 
        });

        router.patch(active.data.current.task.update_status_url, { 
            status: destinationCol, 
            new_index: destIndex
        }, {
            preserveScroll: true, preserveState: true, only: ['kanban'],
            onError: () => {
                dispatch({ type: 'SET_STATE', payload: kanban });
                toast.error('Error al mover la tarea');
            }
        });
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Tareas', href: '/tareas' }]}>
            <Head title="Gestión de Tareas" />
            <div className="p-6 flex flex-col h-screen max-h-[calc(100vh-65px)]">
                {/* Header */}
                <div className="flex justify-between items-center mb-6 shrink-0">
                    <h1 className="text-2xl font-bold text-gray-900">Gestión de Tareas</h1>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
                            <button onClick={() => setViewMode('kanban')} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'kanban' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}><LayoutDashboard size={16} /> Kanban</button>
                            <button onClick={() => setViewMode('list')} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}><List size={16} /> Lista</button>
                        </div>
                        {!isBecario && (
                            <button onClick={() => { setSelectedTask(null); setInitialStatus('pending'); setIsFormOpen(true); }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-sm font-medium"><Plus size={18} /> Nueva Tarea</button>
                        )}
                    </div>
                </div>

                {/* Filtros */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 space-y-4 shrink-0">
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
                        <input 
                            type="text" 
                            placeholder="Buscar por título..." 
                            className="w-full pl-3 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                            value={searchQuery} 
                            onChange={(e) => { setSearchQuery(e.target.value); applyFilters({ search: e.target.value }); }} 
                        />
                        {!isBecario && (
                            <>
                                <MultiSelect 
                                    options={interns.map((i: any) => ({ label: `${i.name} ${i.last_name}`, value: i.id.toString() }))} 
                                    selected={selectedInterns} 
                                    onChange={(v) => { setSelectedInterns(v); applyFilters({ intern_id: v.join(',') }); }} 
                                    placeholder="Alumnos" 
                                />
                                <MultiSelect 
                                    options={centers.map((c: any) => ({ label: c.name, value: c.id.toString() }))} 
                                    selected={selectedCenters} 
                                    onChange={(v) => { setSelectedCenters(v); applyFilters({ center_id: v.join(',') }); }} 
                                    placeholder="Centros" 
                                />
                                <MultiSelect 
                                    options={cycleOptions} 
                                    selected={selectedCycles} 
                                    onChange={(v) => { setSelectedCycles(v); applyFilters({ academic_cycle: v.join(',') }); }} 
                                    placeholder="Ciclos" 
                                />
                            </>
                        )}
                        <MultiSelect 
                            options={[{label:'Baja', value:'low'}, {label:'Media', value:'medium'}, {label:'Alta', value:'high'}, {label:'Urgente', value:'urgent'}]} 
                            selected={selectedPriorities} 
                            onChange={(v) => { setSelectedPriorities(v); applyFilters({ priority: v.join(',') }); }} 
                            placeholder="Prioridad" 
                        />
                        <DatePicker date={selectedDate} onChange={(val) => { setSelectedDate(val || ''); applyFilters({ due_date: val }); }} />
                    </div>
                    <div className="flex justify-end">
                        <button onClick={clearFilters} className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-red-600 transition-colors">
                            <Trash2 size={14} /> Borrar filtros
                        </button>
                    </div>
                </div>

                {/* Tablero Kanban / Lista */}
                {viewMode === 'kanban' ? (
                    <DndContext sensors={sensors} collisionDetection={collisionDetectionStrategy} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                        <div className="flex gap-4 overflow-x-auto pb-4 flex-1 min-h-0 items-start">
                            {Object.entries(state).map(([columnId, tasks]: [string, any]) => (
                                <KanbanColumn key={columnId} columnId={columnId} tasks={tasks} isBecario={isBecario} onEdit={(task: any) => { setSelectedTask(task); setIsFormOpen(true); }} onDelete={(task: any) => { setSelectedTask(task); setIsDeleteOpen(true); }} onCreate={(status: string) => { setInitialStatus(status); setSelectedTask(null); setIsFormOpen(true); }} />
                            ))}
                        </div>
                        <DragOverlay adjustScale={false}>
                            {activeTask ? (
                                <div className="bg-white p-4 rounded-lg border-2 border-blue-500 shadow-2xl w-[310px] cursor-grabbing scale-105 ring-4 ring-blue-500/5">
                                    <div className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border inline-block mb-2 ${getPriorityStyle(activeTask.priority)}`}>
                                        {PRIORITY_LABELS[activeTask.priority]}
                                    </div>
                                    <div className="font-bold text-sm text-slate-800">{activeTask.title}</div>
                                </div>
                            ) : null}
                        </DragOverlay>
                    </DndContext>
                ) : (
                    <div className="flex-1 overflow-hidden bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
                        <div className="overflow-y-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 sticky top-0 z-10">
                                    <tr>
                                        <th className="p-4 text-xs font-bold uppercase text-slate-500 border-b">Tarea</th>
                                        <th className="p-4 text-xs font-bold uppercase text-slate-500 border-b">Estado</th>
                                        <th className="p-4 text-xs font-bold uppercase text-slate-500 border-b">Becario</th>
                                        <th className="p-4 text-xs font-bold uppercase text-slate-500 border-b">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {Object.values(state).flat().map((task: any) => (
                                        <TaskTableRow key={task.id} task={task} isBecario={isBecario} onEdit={(t: any) => { setSelectedTask(t); setIsFormOpen(true); }} onDelete={(t: any) => { setSelectedTask(t); setIsDeleteOpen(true); }} />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                <TaskFormModal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} task={selectedTask} initialStatus={initialStatus} interns={interns} centers={centers}/>
                <DeleteConfirmModal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} onConfirm={() => { if (!selectedTask) return; router.delete(`/tareas/${selectedTask.id}`, { onSuccess: () => setIsDeleteOpen(false) }); }} title="¿Eliminar tarea?" itemName={selectedTask?.title} />
            </div>
        </AppLayout>
    );
}