"use client"

import { useForm } from '@inertiajs/react';
import { X, RefreshCcw, CheckSquare, Paperclip, Users } from 'lucide-react';
import React, { useEffect } from 'react';
import { toast } from 'sonner';
import ClearFiltersButton from '@/components/common/ClearFiltersButton';
import { DatePicker } from "@/components/ui/date-picker";
import { MultiSelect } from "@/components/ui/multi-select";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    task: any;
    initialStatus?: string;
    interns: any[];
    centers: any[];
}

export default function TaskFormModal({ isOpen, onClose, task, initialStatus, interns, centers }: Props) {
    const { data, setData, post, put, processing, reset, errors } = useForm({
        title: '',
        description: '',
        priority: '', 
        due_date: '',
        center_ids: [] as string[], 
        cycles: [] as string[], 
        intern_ids: [] as number[],
        file: null as File | null,
        status: 'pending',
    });

    const centerOptions = centers.map(c => ({ label: c.name, value: String(c.id) }));
    const cycleOptions = [
        { label: "DAM", value: "dam" },
        { label: "DAW", value: "daw" },
        { label: "ASIR", value: "asir" },
    ];

    const filteredInterns = interns.filter(intern => {
        const matchesCenter = data.center_ids.length === 0 || data.center_ids.includes(String(intern.center_id));
        const matchesCycle = data.cycles.length === 0 || data.cycles.includes(intern.academic_cycle?.toLowerCase());
        return matchesCenter && matchesCycle;
    });

    const allFilteredAreSelected = filteredInterns.length > 0 && 
        filteredInterns.every(intern => data.intern_ids.includes(intern.id));

    useEffect(() => {
        if (isOpen) {
            if (task) {
                setData({
                    title: task.title || '',
                    description: task.description || '',
                    priority: task.priority || '',
                    due_date: task.due_date || '',
                    center_ids: task.center_id ? [String(task.center_id)] : [],
                    cycles: [],
                    intern_ids: task.intern_id ? [task.intern_id] : [],
                    file: null,
                    status: task.status || 'pending',
                });
            } else {
                reset();
                if (initialStatus) setData('status', initialStatus);
            }
        }
    }, [task, isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

    const toggleIntern = (id: number) => {
        const currentIds = [...data.intern_ids];
        const index = currentIds.indexOf(id);
        if (index > -1) currentIds.splice(index, 1);
        else currentIds.push(id);
        setData('intern_ids', currentIds);
    };

    const toggleSelectAllVisible = () => {
        const filteredIds = filteredInterns.map(i => i.id);
        if (allFilteredAreSelected) {
            setData('intern_ids', data.intern_ids.filter(id => !filteredIds.includes(id)));
        } else {
            setData('intern_ids', Array.from(new Set([...data.intern_ids, ...filteredIds])));
        }
    };

    const clearFilters = () => {
        setData(prev => ({ ...prev, center_ids: [], cycles: [], intern_ids: [] }));
    };

    const submit = (e: React.SyntheticEvent) => {
        e.preventDefault();
        if (processing) return;

        if (task) {
            put(`/tareas/${task.id}`, {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Tarea actualizada correctamente');
                    onClose();
                }
            });
        } else {
            post('/tareas', {
                forceFormData: true,
                onSuccess: () => {
                    toast.success('Tarea creada y asignada');
                    reset();
                    onClose();
                }
            });
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-200">
                <div className="p-5 border-b flex justify-between items-center bg-slate-50">
                    <h2 className="font-bold text-xl text-slate-700">
                        {task ? 'Editar Tarea' : 'Nueva Tarea'}
                    </h2>
                    <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-200 rounded-full transition-all">
                        <X size={24}/>
                    </button>
                </div>
                
                <form onSubmit={submit} className="p-8">
                    <div className="grid grid-cols-12 gap-8">
                        <div className="col-span-12 md:col-span-5 space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-blue-600 uppercase mb-2">Título</label>
                                <input type="text" value={data.title} onChange={e => setData('title', e.target.value)} className="w-full border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ej: Revisión de código" required />
                                {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-blue-600 uppercase mb-2">Descripción</label>
                                <textarea value={data.description} onChange={e => setData('description', e.target.value)} className="w-full border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none" rows={4} placeholder="Detalles de la tarea..." />
                                {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-blue-600 uppercase mb-2">Prioridad</label>
                                    <select value={data.priority} onChange={e => setData('priority', e.target.value)} className="w-full border-slate-200 rounded-xl p-3 bg-white focus:ring-2 focus:ring-blue-500 outline-none">
                                        <option value="">Seleccionar...</option>
                                        <option value="low">Baja</option>
                                        <option value="medium">Media</option>
                                        <option value="high">Alta</option>
                                        <option value="urgent">Urgente</option>
                                    </select>
                                    {errors.priority && <p className="text-red-500 text-xs mt-1">{errors.priority}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-blue-600 uppercase mb-2">Fecha Límite</label>
                                    <DatePicker date={data.due_date} onChange={(isoDate) => setData('due_date', isoDate || '')} />
                                    {errors.due_date && <p className="text-red-500 text-xs mt-1">{errors.due_date}</p>}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-blue-600 uppercase mb-2">Documento Adjunto</label>
                                <div className="relative flex items-center gap-3 p-3 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 hover:bg-blue-50 transition-all cursor-pointer">
                                    <Paperclip size={18} className="text-blue-600" />
                                    <span className="text-sm font-semibold text-slate-600 truncate">
                                        {data.file ? data.file.name : 'Seleccionar archivo...'}
                                    </span>
                                    <input type="file" onChange={e => setData('file', e.target.files ? e.target.files[0] : null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                </div>
                            </div>
                        </div>

                        {/* Columna Derecha: Asignación */}
                        <div className="col-span-12 md:col-span-7 flex flex-col space-y-4 border-l border-slate-100 pl-8">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-blue-600 uppercase mb-2">Filtrar Centros</label>
                                    <MultiSelect options={centerOptions} selected={data.center_ids} onChange={(values) => setData('center_ids', values)} placeholder="Varios centros..." />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-blue-600 uppercase mb-2">Filtrar Ciclos</label>
                                    <MultiSelect options={cycleOptions} selected={data.cycles} onChange={(values) => setData('cycles', values)} placeholder="Varios ciclos..." />
                                </div>
                            </div>

                            <div className="flex-1 flex flex-col min-h-0">
                                <div className="flex justify-between items-end mb-3">
                                    <label className="text-sm font-bold text-slate-700 uppercase">
                                        Seleccionados: <span className="text-blue-600">{data.intern_ids.length}</span>
                                    </label>
                                    <div className="flex gap-2">
                                        <button type="button" onClick={toggleSelectAllVisible} className="text-xs font-bold text-blue-700 bg-blue-100 px-3 py-2 rounded-lg hover:bg-blue-200 transition-all flex items-center gap-2">
                                            <Users size={14}/> {allFilteredAreSelected ? 'Deseleccionar' : 'Seleccionar visibles'}
                                        </button>
                                        <ClearFiltersButton onClick={clearFilters} className="h-9 px-3 text-xs" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 p-3 border rounded-2xl bg-slate-50/50 shadow-inner overflow-y-auto max-h-[350px]">
                                    {filteredInterns.map((intern: any) => (
                                        <div 
                                            key={intern.id} 
                                            onClick={() => toggleIntern(intern.id)}
                                            className={`flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                                                data.intern_ids.includes(intern.id) 
                                                ? 'bg-blue-600 border-blue-600 text-white shadow-md' 
                                                : 'bg-white border-slate-100 text-slate-700 hover:border-blue-300'
                                            }`}
                                        >
                                            {data.intern_ids.includes(intern.id) ? <CheckSquare size={16} /> : <div className="w-4 h-4 border-2 border-slate-300 rounded bg-white" />}
                                            <div className="flex flex-col truncate">
                                                <span className="text-xs font-bold leading-none truncate">{intern.name} {intern.last_name}</span>
                                                <span className={`text-[9px] uppercase mt-1 ${data.intern_ids.includes(intern.id) ? 'text-blue-100' : 'text-slate-400'}`}>
                                                    {intern.academic_cycle}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                    {filteredInterns.length === 0 && (
                                        <div className="col-span-2 py-10 text-center text-slate-400 italic text-sm">
                                            No se han encontrado alumnos con esos filtros.
                                        </div>
                                    )}
                                </div>
                                {errors.intern_ids && <p className="text-red-500 text-xs mt-2 font-bold">{errors.intern_ids}</p>}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-slate-100">
                        <button type="button" onClick={onClose} className="px-6 py-3 text-slate-500 font-bold hover:text-slate-800 transition-all">
                            Cancelar
                        </button>
                        <button 
                            type="submit" 
                            disabled={processing || data.intern_ids.length === 0} 
                            className="px-10 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-xl hover:bg-blue-700 disabled:bg-slate-300 transition-all flex items-center gap-2"
                        >
                            {processing ? (
                                <> <RefreshCcw size={18} className="animate-spin" /> Guardando... </>
                            ) : task ? (
                                'Actualizar Tarea'
                            ) : (
                                `Asignar a ${data.intern_ids.length} alumnos`
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
