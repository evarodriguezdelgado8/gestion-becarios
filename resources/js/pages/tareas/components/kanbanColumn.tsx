import React, { useState } from 'react';
import { Link } from '@inertiajs/react';
import { Edit, Trash2, User, MessageSquare, Paperclip, Calendar, Plus } from 'lucide-react';
import { getStatusConfig, STATUS_LABELS, PRIORITY_LABELS, getPriorityStyle, getDueDateStyle } from '../taskUtils';

export default function KanbanColumn({ 
    columnId, tasks, isBecario, dragOverColumn, setDragOverColumn, onDrop, onEdit, onDelete, onCreate 
}: any) {
    const config = getStatusConfig(columnId);
    const [dropIndex, setDropIndex] = useState<number | null>(null);

    const handleDragStart = (e: React.DragEvent, index: number) => {
        e.dataTransfer.setData("sourceCol", columnId);
        e.dataTransfer.setData("sourceIndex", index.toString());
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        e.stopPropagation();
        setDropIndex(index);
        setDragOverColumn(columnId);
    };

    const handleOnDrop = (e: React.DragEvent, targetIndex: number) => {
        e.preventDefault();
        e.stopPropagation();
        const sourceCol = e.dataTransfer.getData("sourceCol");
        const sourceIndex = parseInt(e.dataTransfer.getData("sourceIndex"));
        
        setDropIndex(null);
        setDragOverColumn(null);
        
        onDrop(columnId, sourceCol, sourceIndex, targetIndex);
    };

    return (
        <div 
            onDragOver={(e) => { 
                e.preventDefault(); 
                if (tasks.length === 0) setDropIndex(0); 
                setDragOverColumn(columnId); 
            }}
            onDrop={(e) => {
                if (tasks.length === 0) handleOnDrop(e, 0);
            }}
            onDragLeave={(e) => {
                // Solo resetear si salimos del contenedor principal, no de las tarjetas
                if (e.currentTarget === e.target) {
                    setDragOverColumn(null);
                    setDropIndex(null);
                }
            }}
            className={`w-80 flex-shrink-0 bg-slate-50/50 rounded-xl border flex flex-col max-h-full overflow-hidden transition-all ${
                dragOverColumn === columnId ? 'border-blue-400 ring-2 ring-blue-500/10 bg-blue-50/30' : 'border-slate-200'
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
                    {/* Botón de crear recuperado */}
                    {!isBecario && (
                        <button 
                            onClick={() => onCreate(columnId)}
                            className={`p-1 rounded-md hover:bg-white/50 transition-colors cursor-pointer ${config.text}`}
                        >
                            <Plus size={14} />
                        </button>
                    )}
                </div>
            </div>

            <div className="p-3 overflow-y-auto flex-1 min-h-[150px] space-y-3 custom-scrollbar">
                {tasks.map((task: any, index: number) => (
                    <React.Fragment key={task.id}>
                        {dragOverColumn === columnId && dropIndex === index && (
                            <div className="h-1 bg-blue-400 rounded-full w-full animate-pulse" />
                        )}

                        <div 
                            draggable 
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDrop={(e) => handleOnDrop(e, index)}
                            className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm cursor-grab active:cursor-grabbing hover:border-blue-400 transition-all"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${getPriorityStyle(task.priority)}`}>
                                    {PRIORITY_LABELS[task.priority]}
                                </div>
                                {!isBecario && (
                                    <div className="flex gap-1">
                                        <button onClick={() => onEdit(task)} className="p-1 text-slate-400 hover:text-blue-600">
                                            <Edit size={14} />
                                        </button>
                                        <button onClick={() => onDelete(task)} className="p-1 text-slate-400 hover:text-red-600">
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
                                {task.intern ? (
                                    <Link 
                                        href={`/becarios/${task.intern.id}`} 
                                        onPointerDown={(e) => e.stopPropagation()}
                                        className="hover:text-blue-600 hover:underline transition-colors truncate"
                                    >
                                        {task.intern.name} {task.intern.last_name}
                                    </Link>
                                ) : (
                                    <span className="text-slate-400 italic">Sin asignar</span>
                                )}
                            </div>

                            <div className="flex justify-between items-center border-t border-slate-50 pt-3 mt-auto">
                                <div className="flex gap-3 text-slate-400">
                                    <div className="flex items-center gap-1">
                                        <MessageSquare size={12}/>
                                        <span className="text-[10px]">{task.comments?.length || 0}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Paperclip size={12}/>
                                        <span className="text-[10px]">{task.media?.length || 0}</span>
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
                    </React.Fragment>
                ))}

                {/* Área de drop final para soltar tareas al último puesto */}
                <div 
                    className={`h-20 transition-all rounded-lg flex items-center justify-center ${
                        dragOverColumn === columnId && dropIndex === tasks.length 
                        ? 'bg-blue-50/50 border-2 border-dashed border-blue-200' 
                        : 'opacity-0'
                    }`}
                    onDragOver={(e) => handleDragOver(e, tasks.length)}
                    onDrop={(e) => handleOnDrop(e, tasks.length)}
                >
                    {dragOverColumn === columnId && dropIndex === tasks.length && (
                        <span className="text-blue-400 text-[10px] font-medium uppercase tracking-wider">Soltar aquí</span>
                    )}
                </div>
            </div>
        </div>
    );
}