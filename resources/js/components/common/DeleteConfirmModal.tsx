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
    itemName,
}: DeleteConfirmModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="p-6 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
                        <AlertTriangle className="h-7 w-7 text-red-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">{title}</h3>
                    <p className="mt-2 text-sm text-gray-500">
                        Estás a punto de eliminar <strong>{itemName}</strong>. Esta acción no se puede deshacer.
                    </p>
                </div>

                <div className="flex gap-3 bg-gray-50 px-6 py-4">
                    <button
                        onClick={onClose}
                        className="flex-1 cursor-pointer rounded-xl border border-gray-300 bg-white px-4 py-2.5 font-bold text-gray-700 transition-colors hover:bg-gray-100"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 cursor-pointer rounded-xl bg-red-600 px-4 py-2.5 font-bold text-white shadow-lg shadow-red-200 transition-colors hover:bg-red-700"
                    >
                        Sí, eliminar
                    </button>
                </div>
            </div>
        </div>
    );
}
