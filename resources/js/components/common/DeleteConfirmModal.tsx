import { AlertTriangle } from 'lucide-react';
import React from 'react';

interface DeleteConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    itemName: string | undefined;
}

export default function DeleteConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    itemName
}: DeleteConfirmModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-200">
                <div className="p-6 text-center">
                    <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-red-100 mb-4">
                        <AlertTriangle className="h-7 w-7 text-red-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">{title}</h3>
                    <p className="text-sm text-gray-500 mt-2">
                        Estás a punto de eliminar a <strong>{itemName}</strong>. Esta acción no se puede deshacer.
                    </p>
                </div>

                <div className="bg-gray-50 px-6 py-4 flex gap-3">
                    <button 
                        onClick={onClose} 
                        className="flex-1 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={onConfirm} 
                        className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 shadow-lg shadow-red-200 transition-colors cursor-pointer"
                    >
                        Sí, eliminar
                    </button>
                </div>
            </div>
        </div>
    );
}