import { Link } from '@inertiajs/react';
import { Edit, Trash2, User, Calendar } from 'lucide-react';
import React from 'react';
import { getStatusConfig, STATUS_LABELS, PRIORITY_LABELS, getPriorityStyle, getDueDateStyle } from '../taskUtils';

export default function TaskTableRow({ task, isBecario, onEdit, onDelete }: any) {
    const config = getStatusConfig(task.status);
    const StatusIcon = config.icon;

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('es-ES', {
            day: '2-digit', month: '2-digit', year: 'numeric'
        });
    };

    return (
        <tr className="hover:bg-slate-50/50 transition-colors border-b border-slate-100 last:border-0">
            <td className="p-4">
                <Link 
                    href={`/tareas/${task.id}`} 
                    className="font-bold text-slate-800 hover:text-blue-600 transition-colors block w-full"
                >
                    {task.title}
                </Link>                
            </td>

            <td className="p-4">
                <span className={`inline-flex items-center gap-1.5 text-[12px] font-bold px-2.5 py-1 rounded-full border shadow-sm ${config.bg} ${config.text} ${config.border}`}>
                    <StatusIcon size={12} className="opacity-70" />
                    {STATUS_LABELS[task.status]}
                </span>
            </td>

            <td className="p-4 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                    <User size={14} className="text-slate-400 shrink-0" />
                    {task.intern ? (
                        <Link 
                            href={`/becarios/${task.intern.id}`} 
                            className="font-medium hover:text-blue-600 hover:underline transition-colors"
                        >
                            {task.intern.name} {task.intern.last_name}
                        </Link>
                    ) : (
                        <span className="text-slate-400 italic">Sin asignar</span>
                    )}
                </div>
            </td>

            <td className="p-4">
                <span className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded border ${getPriorityStyle(task.priority)}`}>
                    {PRIORITY_LABELS[task.priority]}
                </span>
            </td>

            <td className="p-4">
                {task.due_date ? (
                    <div className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2 py-1 rounded-md border ${getDueDateStyle(task.due_date)}`}>
                        <Calendar size={13} className="opacity-70" />
                        {formatDate(task.due_date)}
                    </div>
                ) : (
                    <span className="text-slate-300">-</span>
                )}
            </td>

            <td className="p-4 text-right">
                {!isBecario && (
                    <div className="flex justify-end gap-1">
                        <button 
                            onClick={() => onEdit(task)} 
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all"
                        >
                            <Edit size={16} />
                        </button>
                        <button 
                            onClick={() => onDelete(task)} 
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                )}
            </td>
        </tr>
    );
}