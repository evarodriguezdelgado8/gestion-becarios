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
import { Head, router, usePage } from '@inertiajs/react';
import { ChevronDown, Plus, LayoutDashboard, List, SlidersHorizontal } from 'lucide-react';
import { useReducer, useState, useEffect, useMemo, useRef } from 'react';
import { toast } from 'sonner';

import ClearFiltersButton from '@/components/common/ClearFiltersButton';
import DeleteConfirmModal from '@/components/common/DeleteConfirmModal';
import { DatePicker } from "@/components/ui/date-picker";
import { MultiSelect } from "@/components/ui/multi-select";
import AppLayout from '@/layouts/app-layout';

import KanbanColumn, { TaskCardPreview } from './components/kanbanColumn';
import TaskTableRow from './components/taskTableRow';
import TaskFormModal from './taskFormModal';
import { kanbanReducer } from './taskUtils';

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
    const [filtersOpen, setFiltersOpen] = useState(false);
    const initialDragStateRef = useRef<any | null>(null);

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
    const activeFiltersCount = [
        searchQuery,
        selectedDate,
        ...selectedInterns,
        ...selectedPriorities,
        ...selectedCenters,
        ...selectedCycles,
    ].filter(Boolean).length;

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

    const findTaskLocation = (board: any, taskId: string | number) => {
        for (const [columnId, tasks] of Object.entries(board) as [string, any[]][]) {
            const index = tasks.findIndex((task: any) => String(task.id) === String(taskId));

            if (index !== -1) {
                return { columnId, index };
            }
        }

        return null;
    };

    const getDropDestination = (over: any, board: any) => {
        const columnId = over.data.current?.columnId || (board[over.id] ? over.id : null);

        if (!columnId || !board[columnId]) {
            return null;
        }

        const overIndex = board[columnId].findIndex((task: any) => String(task.id) === String(over.id));

        if (overIndex === -1) {
            return { columnId, index: board[columnId].length };
        }

        return { columnId, index: overIndex };
    };

    const resetDragState = () => {
        setActiveTask(null);
        initialDragStateRef.current = null;
    };

    const handleDragStart = (event: any) => {
        initialDragStateRef.current = state;
        setActiveTask(event.active.data.current.task);
    };

    const handleDragOver = (event: any) => {
        const { active, over } = event;

        if (!over) return;

        const currentLocation = findTaskLocation(state, active.id);
        const destination = getDropDestination(over, state);

        if (!currentLocation || !destination || currentLocation.columnId === destination.columnId) {
            return;
        }

        dispatch({
            type: 'MOVE_TASK',
            payload: {
                source: currentLocation.columnId,
                destination: destination.columnId,
                sourceIndex: currentLocation.index,
                destIndex: destination.index,
                taskId: active.id,
            },
        });
    };

    const handleDragCancel = () => {
        if (initialDragStateRef.current) {
            dispatch({ type: 'SET_STATE', payload: initialDragStateRef.current });
        }

        resetDragState();
    };

    const handleDragEnd = (event: any) => {
        const { active, over } = event;

        setActiveTask(null);

        if (!over) {
            if (initialDragStateRef.current) {
                dispatch({ type: 'SET_STATE', payload: initialDragStateRef.current });
            }

            resetDragState();
            return;
        }

        const activeId = active.id;
        const originalLocation = findTaskLocation(initialDragStateRef.current || state, activeId);
        const currentLocation = findTaskLocation(state, activeId);
        const destination = getDropDestination(over, state);

        if (!originalLocation || !currentLocation || !destination || !state[destination.columnId]) {
            if (initialDragStateRef.current) {
                dispatch({ type: 'SET_STATE', payload: initialDragStateRef.current });
            }

            resetDragState();
            return;
        }

        const maxDestIndex = currentLocation.columnId === destination.columnId
            ? state[destination.columnId].length - 1
            : state[destination.columnId].length;
        const destIndex = Math.max(0, Math.min(destination.index, Math.max(maxDestIndex, 0)));

        if (currentLocation.columnId !== destination.columnId || currentLocation.index !== destIndex) {
            dispatch({
                type: 'MOVE_TASK',
                payload: {
                    source: currentLocation.columnId,
                    destination: destination.columnId,
                    sourceIndex: currentLocation.index,
                    destIndex,
                    taskId: activeId,
                },
            });
        }

        if (originalLocation.columnId === destination.columnId && originalLocation.index === destIndex) {
            resetDragState();
            return;
        }

        router.patch(active.data.current.task.update_status_url, { 
            status: destination.columnId, 
            new_index: destIndex
        }, {
            preserveScroll: true, preserveState: true, only: ['kanban'],
            onError: () => {
                dispatch({ type: 'SET_STATE', payload: kanban });
                toast.error('Error al mover la tarea');
            }
        });

        resetDragState();
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Tareas', href: '/tareas' }]}>
            <Head title="Gestión de Tareas" />
            <div className="mx-auto flex h-[calc(100vh-65px)] w-full max-w-[96rem] flex-col space-y-6 p-4 md:p-8">
                {/* Header */}
                <div className="flex shrink-0 flex-col items-center justify-between gap-4 md:flex-row">
                    <h1 className="text-2xl font-bold text-gray-900">Gestión de Tareas</h1>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-100 p-1">
                            <button onClick={() => setViewMode('kanban')} className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-bold transition-all ${viewMode === 'kanban' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><LayoutDashboard size={16} /> Kanban</button>
                            <button onClick={() => setViewMode('list')} className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-bold transition-all ${viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><List size={16} /> Lista</button>
                        </div>
                        {!isBecario && (
                            <button onClick={() => { setSelectedTask(null); setInitialStatus('pending'); setIsFormOpen(true); }} className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition-all hover:bg-blue-700"><Plus size={18} /> Nueva Tarea</button>
                        )}
                    </div>
                </div>

                {/* Filtros */}
                <div className="shrink-0 rounded-3xl border border-slate-200/80 bg-white shadow-xl">
                    <div className="flex flex-col justify-between gap-3 px-5 py-4 md:flex-row md:items-center">
                        <button type="button" onClick={() => setFiltersOpen((current) => !current)} className="flex items-center gap-3 text-left">
                            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                                <SlidersHorizontal className="h-5 w-5" />
                            </span>
                            <span>
                                <span className="block text-sm font-black text-slate-900">Filtros</span>
                                <span className="block text-xs font-semibold text-slate-400">
                                    {activeFiltersCount > 0 ? `${activeFiltersCount} filtro(s) activo(s)` : 'Pulsa para filtrar el tablero'}
                                </span>
                            </span>
                        </button>

                        <div className="flex items-center justify-end gap-2">
                            {activeFiltersCount > 0 && <ClearFiltersButton onClick={clearFilters} />}
                            <button type="button" onClick={() => setFiltersOpen((current) => !current)} className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50">
                                <ChevronDown className={`h-4 w-4 transition-transform ${filtersOpen ? 'rotate-180' : ''}`} />
                            </button>
                        </div>
                    </div>

                    {filtersOpen && (
                        <div className="space-y-4 border-t border-slate-100 px-5 pb-5 pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
                        <input 
                            type="text" 
                            placeholder="Buscar por título..." 
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
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
                        </div>
                    )}
                </div>

                {/* Tablero Kanban / Lista */}
                {viewMode === 'kanban' ? (
                    <DndContext sensors={sensors} collisionDetection={collisionDetectionStrategy} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragCancel={handleDragCancel} onDragEnd={handleDragEnd}>
                        <div className="grid min-h-0 flex-1 auto-cols-[minmax(17rem,1fr)] grid-flow-col items-start gap-3 overflow-x-auto overflow-y-hidden pb-4 xl:grid-flow-row xl:grid-cols-5 xl:auto-cols-auto xl:overflow-y-auto">
                            {Object.entries(state).map(([columnId, tasks]: [string, any]) => (
                                <KanbanColumn key={columnId} columnId={columnId} tasks={tasks} isBecario={isBecario} onEdit={(task: any) => { setSelectedTask(task); setIsFormOpen(true); }} onDelete={(task: any) => { setSelectedTask(task); setIsDeleteOpen(true); }} onCreate={(status: string) => { setInitialStatus(status); setSelectedTask(null); setIsFormOpen(true); }} />
                            ))}
                        </div>
                        <DragOverlay adjustScale={false}>
                            {activeTask ? (
                                <div className="group w-[310px] cursor-grabbing rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl">
                                    <TaskCardPreview task={activeTask} isBecario={isBecario} clickable={false} />
                                </div>
                            ) : null}
                        </DragOverlay>
                    </DndContext>
                ) : (
                    <div className="flex flex-1 flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xl">
                        <div className="overflow-y-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="sticky top-0 z-10 bg-slate-50/90">
                                    <tr>
                                        <th className="border-b border-slate-100 p-4 text-xs font-black uppercase tracking-widest text-slate-400">Tarea</th>
                                        <th className="border-b border-slate-100 p-4 text-xs font-black uppercase tracking-widest text-slate-400">Estado</th>
                                        <th className="border-b border-slate-100 p-4 text-xs font-black uppercase tracking-widest text-slate-400">Becario</th>
                                        <th className="border-b border-slate-100 p-4 text-xs font-black uppercase tracking-widest text-slate-400">Acciones</th>
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
