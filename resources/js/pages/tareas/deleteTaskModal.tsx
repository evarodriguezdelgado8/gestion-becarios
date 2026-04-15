import { router } from '@inertiajs/react';
import { Trash2 } from 'lucide-react';
import React from 'react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    task: any;
}

export default function DeleteTaskModal({ isOpen, onClose, task }: Props) {
    const confirmDelete = () => {
        if (!task) return;
        router.delete(`/tareas/${task.id}`, {
            onSuccess: () => onClose(),
        });
    };

    if (!isOpen || !task) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
                <div className="p-6 text-center">
                    <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Trash2 size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">¿Eliminar tarea?</h3>
                    <p className="text-sm text-slate-500 mb-1">Vas a borrar: <strong>{task.title}</strong></p>
                    <p className="text-xs text-slate-400 mb-6">Esta acción no se puede deshacer.</p>
                    <div className="flex gap-3">
                        <button 
                            onClick={onClose} 
                            className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                        >
                            Cancelar
                        </button>
                        <button 
                            onClick={confirmDelete} 
                            className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                        >
                            Sí, eliminar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}