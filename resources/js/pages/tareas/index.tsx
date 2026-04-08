import React, { useReducer, useState, useEffect } from 'react';
import { Head, router, useForm, Link, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { 
    Plus, Calendar, CheckSquare, User, 
    MessageSquare, Paperclip, X, Edit, Trash2, Check
} from 'lucide-react';
import { toast } from 'sonner';

interface Task {
    id: number;
    title: string;
    description: string;
    status: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    due_date?: string;
    intern: { name: string; last_name: string };
    media?: any[];
    update_status_url: string;
    intern_id: number;
    center_id: number;
}

interface KanbanState {
    [key: string]: Task[];
}

type Action = 
    | { type: 'MOVE_TASK'; payload: { source: string; destination: string; sourceIndex: number; destIndex: number } }
    | { type: 'SET_STATE'; payload: KanbanState };

function kanbanReducer(state: KanbanState, action: Action): KanbanState {
    switch (action.type) {
        case 'MOVE_TASK': {
            const { source, destination, sourceIndex, destIndex } = action.payload;
            const sourceCol = [...state[source]];
            const destCol = [...state[destination]];
            
            const [movedTask] = sourceCol.splice(sourceIndex, 1);
            movedTask.status = destination; 
            destCol.splice(destIndex, 0, movedTask);

            return { ...state, [source]: sourceCol, [destination]: destCol };
        }
        case 'SET_STATE': return action.payload;
        default: return state;
    }
}

const STATUS_LABELS: Record<string, string> = {
    pending: 'Pendiente',
    in_progress: 'En Progreso',
    in_review: 'En Revisión',
    completed: 'Completado',
    rejected: 'Rechazado'
};

const PRIORITY_LABELS: Record<string, string> = {
    low: 'Baja',
    medium: 'Media',
    high: 'Alta',
    urgent: 'Urgente'
};

export default function Index({ kanban, interns, centers }: any) {
    const { auth } = usePage().props as any;
    
    const isBecario = auth?.user?.roles?.some((r: any) => {
        const roleName = typeof r === 'object' ? r.name : r;
        return roleName?.toLowerCase().includes('intern');
    }) ?? false;

    const [state, dispatch] = useReducer(kanbanReducer, kanban);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [taskToDelete, setTaskToDelete] = useState<number | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    // NUEVO: useForm con intern_ids (array) y cycle (filtro)
    const { data, setData, post, processing, errors, reset } = useForm({
        title: '',
        description: '',
        intern_ids: [] as number[], // Array para selección múltiple
        center_id: '',
        cycle: '', // Nuevo campo para filtrar (DAM, DAW, ASIR)
        priority: '' as any, // Vacío por defecto para forzar selección
        due_date: '',
        file: null as File | null,
    });

    useEffect(() => {
        dispatch({ type: 'SET_STATE', payload: kanban });
    }, [kanban]);

    // LÓGICA DE FILTRADO PARA EL MODAL
    const filteredInterns = interns.filter((intern: any) => {
        const matchesCenter = data.center_id ? intern.center_id.toString() === data.center_id : true;
        const matchesCycle = data.cycle ? intern.cycle?.toLowerCase() === data.cycle.toLowerCase() : true;
        return matchesCenter && matchesCycle;
    });

    const toggleIntern = (id: number) => {
        const currentIds = [...data.intern_ids];
        if (currentIds.includes(id)) {
            setData('intern_ids', currentIds.filter(i => i !== id));
        } else {
            setData('intern_ids', [...currentIds, id]);
        }
    };

    const isDateUrgent = (dateStr: string) => {
        if (!dateStr) return false;
        const today = new Date();
        const due = new Date(dateStr);
        const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 2; // Resaltado si faltan 2 días o menos
    };

    const handleEdit = (task: any) => {
        setEditingTask(task);
        setData({
            title: task.title,
            description: task.description || '',
            intern_ids: [task.intern_id], // En edición solo cargamos el suyo
            center_id: task.center_id.toString(),
            cycle: task.intern?.cycle || '', 
            priority: task.priority,
            due_date: task.due_date || '',
            file: null,
        });
        setIsModalOpen(true);
    };

    const handleDelete = (id: number) => {
        setTaskToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (taskToDelete) {
            router.delete(`/tareas/${taskToDelete}`, {
                onSuccess: () => {
                    toast.success('Tarea eliminada correctamente');
                    setIsDeleteModalOpen(false);
                    setTaskToDelete(null);
                },
                onError: () => toast.error('No se pudo eliminar la tarea')
            });
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingTask(null);
        reset();
    };

    const onDragEnd = (result: DropResult) => {
        const { source, destination } = result;
        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        const taskToMove = state[source.droppableId][source.index];

        dispatch({
            type: 'MOVE_TASK',
            payload: {
                source: source.droppableId,
                destination: destination.droppableId,
                sourceIndex: source.index,
                destIndex: destination.index
            }
        });

        router.patch(taskToMove.update_status_url, {
            status: destination.droppableId
        }, {
            preserveScroll: true,
            onSuccess: () => toast.success('Estado actualizado'),
            onError: () => toast.error('Error al guardar cambios')
        });
    };

    const submit = (e: React.SyntheticEvent) => {
        e.preventDefault();
        if (editingTask) {
            router.post(`/tareas/${editingTask.id}`, {
                _method: 'put',
                ...data,
            }, {
                forceFormData: true,
                onSuccess: () => {
                    closeModal();
                    toast.success('Tarea actualizada');
                },
            });
        } else {
            post('/tareas', {
                forceFormData: true,
                onSuccess: () => {
                    closeModal();
                    toast.success('Tarea creada con éxito');
                },
            });
        }
    };

    const getPriorityStyle = (priority: string) => {
        const styles: any = {
            urgent: 'bg-red-100 text-red-700 border-red-200',
            high: 'bg-orange-100 text-orange-700 border-orange-200',
            medium: 'bg-blue-100 text-blue-700 border-blue-200',
            low: 'bg-gray-100 text-gray-700 border-gray-200'
        };
        return styles[priority] || styles.low;
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Tareas', href: '/tareas' }]}>
            <Head title="Tablero Kanban" />

            <div className="p-6 flex flex-col h-screen max-h-[calc(100vh-65px)]">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <CheckSquare className="text-blue-600" /> Tablero de Tareas
                        </h1>
                    </div>
                    {!isBecario && (
                        <button 
                            onClick={() => setIsModalOpen(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-sm font-medium"
                        >
                            <Plus size={18} /> Nueva Tarea
                        </button>
                    )}
                </div>

                <DragDropContext onDragEnd={onDragEnd}>
                    <div className="flex gap-4 overflow-x-auto pb-4 h-full items-start">
                        {Object.entries(state).map(([columnId, tasks]: [string, any]) => (
                            <div key={columnId} className="w-80 flex-shrink-0 bg-slate-50 rounded-xl border border-slate-200 flex flex-col max-h-full">
                                <div className="p-3 border-b border-slate-200 bg-white/50 flex justify-between items-center rounded-t-xl">
                                    <h3 className="font-bold text-[11px] uppercase tracking-wider text-slate-500">
                                        {STATUS_LABELS[columnId] || columnId}
                                    </h3>
                                    <span className="bg-slate-200 text-slate-600 text-[10px] px-2.5 py-1 rounded-full font-bold">
                                        {tasks.length}
                                    </span>
                                </div>

                                <Droppable droppableId={columnId}>
                                    {(provided) => (
                                        <div {...provided.droppableProps} ref={provided.innerRef} className="p-3 flex-1 overflow-y-auto min-h-[150px]">
                                            {tasks.map((task: Task, index: number) => (
                                                <Draggable key={task.id} draggableId={task.id.toString()} index={index}>
                                                    {(provided) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm mb-3 hover:border-blue-400 transition-all"
                                                        >
                                                            <div className="flex justify-between items-start mb-2">
                                                                <div className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border ${getPriorityStyle(task.priority)}`}>
                                                                    {PRIORITY_LABELS[task.priority]}
                                                                </div>
                                                                
                                                                {!isBecario && (
                                                                    <div className="flex gap-1">
                                                                        <button 
                                                                            type="button"
                                                                            onClick={() => handleEdit(task)} 
                                                                            className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                                        >
                                                                            <Edit size={14} />
                                                                        </button>
                                                                        <button 
                                                                            type="button"
                                                                            onClick={() => handleDelete(task.id)} 
                                                                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                                        >
                                                                            <Trash2 size={14} />
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        
                                                            <Link href={`/tareas/${task.id}`} className="block mb-2 group/title">
                                                                <h4 className="text-sm font-bold text-slate-800 group-hover/title:text-blue-700 transition-colors line-clamp-2">
                                                                    {task.title}
                                                                </h4>
                                                            </Link>
                                                            
                                                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-4">
                                                                <User size={12} className="text-slate-400" />
                                                                <span className="truncate">
                                                                    {task.intern?.name ? `${task.intern.name} ${task.intern.last_name}` : 'Sin asignar'}
                                                                </span>
                                                            </div>

                                                            <div className="flex justify-between items-center border-t border-slate-50 pt-3">
                                                                <div className="flex gap-3 text-slate-400">
                                                                    <div className="flex items-center gap-1">
                                                                        <MessageSquare size={12}/>
                                                                        <span className="text-[10px]">0</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-1">
                                                                        <Paperclip size={12}/>
                                                                        <span className="text-[10px]">{task.media?.length || 0}</span>
                                                                    </div>
                                                                </div>
                                                                
                                                                {task.due_date && (
                                                                    <div className="text-[10px] font-medium px-2 py-0.5 rounded flex items-center gap-1 bg-slate-50 text-slate-600">
                                                                        <Calendar size={10} /> 
                                                                        {task.due_date}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            </div>
                        ))}
                    </div>
                </DragDropContext>
            </div>

            {/* MODAL DE TAREA MULTIFUNCIONAL */}
            {!isBecario && isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200">
                        <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                            <h2 className="font-bold text-slate-700">{editingTask ? 'Editar Tarea' : 'Asignar Tarea Múltiple'}</h2>
                            <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-200 rounded-full transition-all"><X size={20}/></button>
                        </div>
                        
                        <form onSubmit={submit} className="p-6 space-y-4">
                            {/* Titulo y descripción se mantienen */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Título</label>
                                <input type="text" value={data.title} onChange={e => setData('title', e.target.value)} className="w-full border-slate-200 rounded-lg text-sm focus:ring-blue-500" placeholder="Ej: Corregir bugs" />
                                {errors.title && <p className="text-red-500 text-[10px] mt-1">{errors.title}</p>}
                            </div>
                            
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Descripción</label>
                                <textarea value={data.description} onChange={e => setData('description', e.target.value)} className="w-full border-slate-200 rounded-lg text-sm focus:ring-blue-500" rows={2} placeholder="Detalles de la tarea..." />
                            </div>

                            {/* Filtros dinámicos */}
                            <div className="grid grid-cols-2 gap-3 bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                                <div>
                                    <label className="block text-[10px] font-bold text-blue-600 uppercase mb-1">Centro</label>
                                    <select value={data.center_id} onChange={e => setData('center_id', e.target.value)} className="w-full border-slate-200 rounded-lg text-xs">
                                        <option value="">Todos los centros</option>
                                        {centers.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-blue-600 uppercase mb-1">Ciclo Formativo</label>
                                    <select value={data.cycle} onChange={e => setData('cycle', e.target.value)} className="w-full border-slate-200 rounded-lg text-xs">
                                        <option value="">Todos los ciclos</option>
                                        <option value="dam">DAM</option>
                                        <option value="daw">DAW</option>
                                        <option value="asir">ASIR</option>
                                    </select>
                                </div>
                            </div>

                            {/* Selección múltiple de becarios */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Seleccionar Becarios ({data.intern_ids.length})</label>
                                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto p-1">
                                    {filteredInterns.length > 0 ? (
                                        filteredInterns.map((intern: any) => (
                                            <div 
                                                key={intern.id} 
                                                onClick={() => toggleIntern(intern.id)}
                                                className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                                                    data.intern_ids.includes(intern.id) ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-700 hover:border-blue-400'
                                                }`}
                                            >
                                                {data.intern_ids.includes(intern.id) ? <CheckSquare size={14} /> : <div className="w-3.5 h-3.5 border border-slate-300 rounded" />}
                                                <span className="text-[11px] font-medium truncate">{intern.name} {intern.last_name}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-[10px] text-slate-400 col-span-2 text-center py-2 italic">No hay becarios con estos filtros.</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Prioridad</label>
                                    <select 
                                        value={data.priority} 
                                        onChange={e => setData('priority', e.target.value as any)} 
                                        className="w-full border-slate-200 rounded-lg text-sm focus:ring-blue-500"
                                    >
                                        <option value="" disabled>Seleccionar...</option>
                                        <option value="low">Baja</option>
                                        <option value="medium">Media</option>
                                        <option value="high">Alta</option>
                                        <option value="urgent">Urgente</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fecha Límite</label>
                                    <input 
                                        type="date" 
                                        value={data.due_date} 
                                        onChange={e => setData('due_date', e.target.value)} 
                                        className={`w-full border-slate-200 rounded-lg text-sm focus:ring-blue-500 transition-colors ${isDateUrgent(data.due_date) ? 'bg-red-50 border-red-300 text-red-900' : ''}`} 
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Documento (Opcional)</label>
                                <div className="mt-1 flex items-center gap-2 p-2 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                                    <Paperclip size={16} className="text-slate-400" />
                                    <input type="file" onChange={e => setData('file', e.target.files ? e.target.files[0] : null)} className="text-[10px] w-full file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <button type="button" onClick={closeModal} className="px-4 py-2 text-sm text-slate-600 font-medium hover:text-slate-800">Cancelar</button>
                                <button 
                                    type="submit" 
                                    disabled={processing || data.intern_ids.length === 0} 
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:bg-slate-300 disabled:shadow-none transition-all"
                                >
                                    {processing ? 'Guardando...' : editingTask ? 'Actualizar' : `Asignar a ${data.intern_ids.length} Alumnos`}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL DE ELIMINACIÓN */}
            {!isBecario && isDeleteModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
                        <div className="p-6 text-center">
                            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash2 size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">¿Eliminar tarea?</h3>
                            <p className="text-sm text-slate-500 mb-6">Esta acción no se puede deshacer.</p>
                            <div className="flex gap-3">
                                <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">Cancelar</button>
                                <button onClick={confirmDelete} className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors">Sí, eliminar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}