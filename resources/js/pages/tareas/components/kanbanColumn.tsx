import { Link } from '@inertiajs/react';
import { Edit, Trash2, User, MessageSquare, Calendar, Plus } from 'lucide-react';
import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { getStatusConfig, STATUS_LABELS, PRIORITY_LABELS, getPriorityStyle, getDueDateStyle } from '../taskUtils';

function TaskCard({ task, isBecario, onEdit, onDelete, columnId }: any) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ 
        id: task.id,
        data: { task, columnId }
    });

    const style = {
        // Usamos Translate para que el movimiento sea fluido sin torcerse
        transform: CSS.Translate.toString(transform),
        transition,
        // Al arrastrar, la tarjeta original ocupa el sitio pero no se ve
        opacity: isDragging ? 0 : 1,
    };

    return (
        <div 
            ref={setNodeRef} 
            style={style} 
            {...attributes} 
            {...listeners}
            // Mantenemos tus clases, pero quitamos el z-10 para que no tape el overlay
            className={`bg-white p-4 rounded-lg border border-slate-200 shadow-sm cursor-grab active:cursor-grabbing hover:border-blue-400 transition-all group relative ${isDragging ? 'invisible' : ''}`}
        >
            <div className="flex justify-between items-start mb-2">
                <div className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${getPriorityStyle(task.priority)}`}>
                    {PRIORITY_LABELS[task.priority]}
                </div>
                {!isBecario && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => { e.stopPropagation(); onEdit(task); }} className="p-1 text-slate-400 hover:text-blue-600">
                            <Edit size={14} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); onDelete(task); }} className="p-1 text-slate-400 hover:text-red-600">
                            <Trash2 size={14} />
                        </button>
                    </div>
                )}
            </div>

            <Link 
                href={`/tareas/${task.id}`} 
                onPointerDown={(e) => e.stopPropagation()}
                className="block mb-2 font-bold text-sm text-slate-800 hover:text-blue-700 line-clamp-2"
            >
                {task.title}
            </Link>

            <div className="flex items-center gap-1.5 text-[12px] text-slate-500 mb-4">
                <User size={12} className="shrink-0" />
                <span className="truncate">
                    {task.intern ? `${task.intern.name} ${task.intern.last_name}` : 'Sin asignar'}
                </span>
            </div>

            <div className="flex justify-between items-center border-t border-slate-50 pt-3">
                <div className="flex gap-3 text-slate-400">
                    <div className="flex items-center gap-1">
                        <MessageSquare size={12}/>
                        <span className="text-[10px]">{task.comments_count || 0}</span>
                    </div>
                </div>
                {task.due_date && (
                    <div className={`text-[11px] font-bold px-2 py-0.5 rounded border flex items-center gap-1 ${getDueDateStyle(task.due_date)}`}>
                        <Calendar size={10} /> 
                        {new Date(task.due_date).toLocaleDateString('es-ES')}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function KanbanColumn({ 
    columnId, tasks, isBecario, onEdit, onDelete, onCreate 
}: any) {
    const config = getStatusConfig(columnId);
    const { setNodeRef, isOver } = useDroppable({ 
        id: columnId,
        data: { columnId }
    });

    return (
        <div 
            ref={setNodeRef}
            className={`w-80 flex-shrink-0 bg-slate-50/50 rounded-xl border flex flex-col max-h-full overflow-hidden transition-all ${
                isOver ? 'border-blue-400 ring-2 ring-blue-500/10 bg-blue-50/30' : 'border-slate-200'
            }`}
        >
            <div className={`p-3 border-b ${config.borderHeader} ${config.bg} flex justify-between items-center shrink-0`}>
                <div className="flex items-center gap-2">
                    <config.icon size={14} className={config.text} />
                    <h3 className={`font-bold text-[11px] uppercase tracking-wider ${config.text}`}>
                        {STATUS_LABELS[columnId]}
                    </h3>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`${config.text} bg-white/50 text-[10px] px-2 py-0.5 rounded-md font-bold border border-current/10`}>
                        {tasks.length}
                    </span>
                    {!isBecario && (
                        <button onClick={() => onCreate(columnId)} className={`p-1 rounded-md hover:bg-white/50 transition-colors ${config.text}`}>
                            <Plus size={14} />
                        </button>
                    )}
                </div>
            </div>

            {/* MEJORA: Un poco más de padding y espacio entre tareas para que se vea el hueco */}
            <div className="p-3 overflow-y-auto flex-1 min-h-[200px] space-y-3 custom-scrollbar pb-10">
                <SortableContext items={tasks.map((t: any) => t.id)} strategy={verticalListSortingStrategy}>
                    {/* Un pequeño margen inicial invisible para facilitar meterla arriba del todo */}
                    <div className="h-0.5" />
                    {tasks.map((task: any) => (
                        <TaskCard key={task.id} task={task} columnId={columnId} isBecario={isBecario} onEdit={onEdit} onDelete={onDelete} />
                    ))}
                </SortableContext>
                
                {tasks.length === 0 && (
                    <div className="h-32 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center text-slate-400 text-xs italic">
                        Sin tareas
                    </div>
                )}
            </div>
        </div>
    );
}