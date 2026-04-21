import { Head, router, Link, usePage } from '@inertiajs/react';
import { 
    Plus, Trash2, LayoutDashboard, List
} from 'lucide-react';
import { useReducer, useState, useEffect } from 'react';
import { toast } from 'sonner';

import DeleteConfirmModal from '@/components/common/DeleteConfirmModal';
import { DatePicker } from "@/components/ui/date-picker";
import { MultiSelect } from "@/components/ui/multi-select";
import AppLayout from '@/layouts/app-layout';

import KanbanColumn from './components/kanbanColumn';
import TaskTableRow from './components/taskTableRow';
import TaskFormModal from './taskFormModal';
import { kanbanReducer } from './taskUtils';

export default function Index({ kanban = {}, interns = [], centers = [], filters }: any) {
    const { auth } = usePage().props as any;
    
    // Definición de Becario: si tiene el rol 'intern'
    const isBecario = auth?.user?.roles?.some((r: any) => 
        (typeof r === 'object' ? r.name : r)?.toLowerCase().includes('intern')
    ) ?? false;

    const [state, dispatch] = useReducer(kanbanReducer, kanban);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<any | null>(null);
    const [initialStatus, setInitialStatus] = useState<string>('pending');
    const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
    const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

    // Estados de filtros
    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [selectedInterns, setSelectedInterns] = useState<string[]>(filters.intern_id ? filters.intern_id.split(',') : []);
    const [selectedCenters, setSelectedCenters] = useState<string[]>(filters.center_id ? filters.center_id.split(',') : []);
    const [selectedPriorities, setSelectedPriorities] = useState<string[]>(filters.priority ? filters.priority.split(',') : []);
    const [selectedCycles, setSelectedCycles] = useState<string[]>(filters.academic_cycle ? filters.academic_cycle.split(',') : []);
    const [selectedDate, setSelectedDate] = useState(filters.due_date || '');

    useEffect(() => { dispatch({ type: 'SET_STATE', payload: kanban }); }, [kanban]);

    const applyFilters = (overrides = {}) => {
        const params = {
            search: searchQuery,
            intern_id: 'intern_id' in overrides ? overrides.intern_id : (selectedInterns.length > 0 ? selectedInterns.join(',') : null),
            center_id: 'center_id' in overrides ? overrides.center_id : (selectedCenters.length > 0 ? selectedCenters.join(',') : null),
            priority: 'priority' in overrides ? overrides.priority : (selectedPriorities.length > 0 ? selectedPriorities.join(',') : null),
            academic_cycle: 'academic_cycle' in overrides ? overrides.academic_cycle : (selectedCycles.length > 0 ? selectedCycles.join(',') : null),
            due_date: selectedDate,
            ...overrides 
        };
        const cleanParams = Object.fromEntries(Object.entries(params).filter(([_, v]) => v !== "" && v !== null && v !== undefined));
        router.get('/tareas', cleanParams as any, { preserveState: true, replace: true, preserveScroll: true });
    };

    const clearFilters = () => {
        setSearchQuery(''); setSelectedInterns([]); setSelectedCenters([]); setSelectedPriorities([]); setSelectedCycles([]); setSelectedDate('');
        router.get('/tareas', {}, { replace: true, preserveState: false });
    };

    const handleCreate = (status: string = 'pending') => {
        setSelectedTask(null); setInitialStatus(status); setIsFormOpen(true);
    };

    const handleEdit = (task: any) => {
        setSelectedTask(task); setIsFormOpen(true);
    };

    const handleDeleteClick = (task: any) => {
        setSelectedTask(task); setIsDeleteOpen(true);
    };

    const confirmDelete = () => {
        if (!selectedTask) return;
        router.delete(`/tareas/${selectedTask.id}`, {
            onSuccess: () => setIsDeleteOpen(false),
            onError: () => toast.error('Error al eliminar la tarea')
        });
    };

    const handleDrop = (destinationCol: string, sourceCol: string, sourceIndex: number, destIndex: number) => {
        setDragOverColumn(null);
    
        if (sourceCol === destinationCol && sourceIndex === destIndex) return;
    
        const taskToMove = state[sourceCol][sourceIndex];
    
        dispatch({ 
            type: 'MOVE_TASK', 
            payload: { 
                source: sourceCol, 
                destination: destinationCol, 
                sourceIndex, 
                destIndex 
            } 
        });
    
        router.patch(taskToMove.update_status_url, { 
            status: destinationCol, 
            new_index: destIndex
        }, {
            preserveScroll: true,
            preserveState: true,
            only: ['kanban'],
            onError: () => {
                dispatch({ type: 'SET_STATE', payload: kanban });
                toast.error('Error al actualizar la posición de la tarea');
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
                            <button onClick={() => handleCreate('pending')} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-sm font-medium"><Plus size={18} /> Nueva Tarea</button>
                        )}
                    </div>
                </div>

                {/* Filtros */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
                        {/* 1. Buscar Texto (Todos) */}
                        <input 
                            type="text" 
                            placeholder="Buscar..." 
                            className="w-full pl-3 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                            value={searchQuery} 
                            onChange={(e) => setSearchQuery(e.target.value)} 
                        />
                        
                        {/* 2. Alumnos (Solo Admin/Tutor) */}
                        {!isBecario && (
                            <MultiSelect 
                                options={interns.map((i: any) => ({ label: `${i.name} ${i.last_name}`, value: i.id.toString() }))} 
                                selected={selectedInterns} 
                                onChange={(v) => { setSelectedInterns(v); applyFilters({ intern_id: v.join(',') }); }} 
                                placeholder="Alumnos" 
                            />
                        )}
                        
                        {/* 3. Prioridad (Todos) */}
                        <MultiSelect 
                            options={[{label:'Baja', value:'low'}, {label:'Media', value:'medium'}, {label:'Alta', value:'high'}, {label:'Urgente', value:'urgent'}]} 
                            selected={selectedPriorities} 
                            onChange={(v) => { setSelectedPriorities(v); applyFilters({ priority: v.join(',') }); }} 
                            placeholder="Prioridad" 
                        />
                        
                        {/* 4. Centros (Solo Admin/Tutor) */}
                        {!isBecario && (
                            <MultiSelect 
                                options={centers.map((c: any) => ({ label: c.name, value: c.id.toString() }))} 
                                selected={selectedCenters} 
                                onChange={(v) => { setSelectedCenters(v); applyFilters({ center_id: v.join(',') }); }} 
                                placeholder="Centros" 
                            />
                        )}
                        
                        {/* 5. Ciclos (Solo Admin/Tutor) */}
                        {!isBecario && (
                            <MultiSelect 
                                options={[{label:"DAM", value:"dam"}, {label:"DAW", value:"daw"}, {label:"ASIR", value:"asir"}]} 
                                selected={selectedCycles} 
                                onChange={(v) => { setSelectedCycles(v); applyFilters({ academic_cycle: v.join(',') }); }} 
                                placeholder="Ciclos" 
                            />
                        )}
                        
                        {/* 6. Fecha (Todos) */}
                        <DatePicker date={selectedDate} onChange={(val) => { setSelectedDate(val || ''); applyFilters({ due_date: val }); }} />
                    </div>
                    <div className="flex justify-end">
                        <button onClick={clearFilters} className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-red-600 transition-colors">
                            <Trash2 size={14} /> Borrar filtros
                        </button>
                    </div>
                </div>

                {/* Contenido Principal */}
                {viewMode === 'kanban' ? (
                    <div className="flex gap-4 overflow-x-auto pb-4 flex-1 min-h-0 items-start">
                        {Object.entries(state).map(([columnId, tasks]: [string, any]) => (
                            <KanbanColumn 
                                key={columnId}
                                columnId={columnId}
                                tasks={tasks}
                                isBecario={isBecario}
                                dragOverColumn={dragOverColumn}
                                setDragOverColumn={setDragOverColumn}
                                onDrop={handleDrop}
                                onEdit={handleEdit}
                                onDelete={handleDeleteClick}
                            />
                        ))}
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
                                        <th className="p-4 text-xs font-bold uppercase text-slate-500 border-b text-right"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {Object.values(state).flat().map((task: any) => (
                                        <TaskTableRow key={task.id} task={task} isBecario={isBecario} onEdit={handleEdit} onDelete={handleDeleteClick} />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Modales */}
                <TaskFormModal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} task={selectedTask} initialStatus={initialStatus} interns={interns} centers={centers}/>
                
                <DeleteConfirmModal 
                    isOpen={isDeleteOpen} 
                    onClose={() => setIsDeleteOpen(false)} 
                    onConfirm={confirmDelete}
                    title="¿Eliminar tarea?"
                    itemName={selectedTask?.title}
                />
            </div>
        </AppLayout>
    );
}