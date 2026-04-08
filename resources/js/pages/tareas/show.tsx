import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { 
    Calendar, User, ArrowLeft, 
    FileText, Send, Paperclip, CheckCircle2,
    Clock, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface Props {
    task: any;
    documents: {
        specifications: string | null;
        deliverables: Array<{ url: string; name: string }>;
    };
}

export default function Show({ task, documents }: Props) {

    const { data, setData, post, processing, reset, errors } = useForm({
        body: '',
        deliverable: null as File | null,
    });

    const submitComment = (e: React.SyntheticEvent) => {
        e.preventDefault();
    
        if (!task?.id) {
            toast.error('Error: No se encontró el ID de la tarea');
            return;
        }
        
        post(`/tareas/${task.id}/comments`, {
            forceFormData: true,
            onSuccess: () => {
                reset('body', 'deliverable');
                toast.success('Mensaje enviado correctamente');
            },
            onError: (errors) => {
                console.error(errors);
                toast.error('Error al enviar el comentario');
            }
        });
    };

    const PRIORITY_LABELS: Record<string, string> = {
        urgent: 'Urgente',
        high: 'Alta',
        medium: 'Media',
        low: 'Baja'
    };
    
    const STATUS_LABELS: Record<string, string> = {
        pending: 'Pendiente',
        in_progress: 'En Curso',
        in_review: 'En Revisión',
        completed: 'Completada',
        rejected: 'Rechazada'
    };

    const getPriorityColor = (priority: string) => {
        const colors: any = {
            urgent: 'text-red-600 bg-red-50 border-red-100',
            high: 'text-orange-600 bg-orange-50 border-orange-100',
            medium: 'text-blue-600 bg-blue-50 border-blue-100',
            low: 'text-slate-600 bg-slate-50 border-slate-100'
        };
        return colors[priority] || colors.low;
    };

    return (
        <AppLayout breadcrumbs={[
            { title: 'Tablero', href: '/tareas' },
            { title: 'Detalle de Tarea', href: '#' }
        ]}>
            <Head title={`Tarea: ${task.title}`} />

            <div className="max-w-6xl mx-auto p-4 lg:p-8">
                <Link 
                    href="/tareas" 
                    className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-600 mb-6 transition-colors font-medium text-sm"
                >
                    <ArrowLeft size={16} /> Volver al tablero de tareas
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    <div className="lg:col-span-2 space-y-6">
                        
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 lg:p-8">
                            <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
                                <div className="space-y-1">
                                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                                        {task.title}
                                    </h1>
                                    <div className="flex items-center gap-2 text-slate-500 text-sm">
                                        <Clock size={14} />
                                        <span>Creada por {task.creator?.name}</span>
                                    </div>
                                </div>
                                <div className={`px-4 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wider ${getPriorityColor(task.priority)}`}>
                                   {PRIORITY_LABELS[task.priority] || task.priority}
                                </div>
                            </div>

                            <div className="prose prose-slate max-w-none">
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Descripción</h3>
                                <p className="text-slate-700 leading-relaxed whitespace-pre-wrap bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    {task.description || "Esta tarea no tiene una descripción detallada."}
                                </p>
                            </div>

                            {documents.specifications && (
                                <div className="mt-8 pt-6 border-t border-slate-100">
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Material de Referencia</h3>
                                    <a 
                                        href={documents.specifications} 
                                        target="_blank" 
                                        className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-100 hover:bg-blue-100 transition-colors group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="bg-blue-600 text-white p-2 rounded-lg shadow-sm">
                                                <FileText size={20} />
                                            </div>
                                            <span className="font-bold text-blue-900 text-sm group-hover:underline">Descargar Guía de la Tarea</span>
                                        </div>
                                        <Paperclip size={18} className="text-blue-400" />
                                    </a>
                                </div>
                            )}
                        </div>

                        {/* Hilo de Comentarios / Entregas */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                            <div className="p-4 border-b bg-slate-50 font-bold text-slate-700 text-sm flex items-center gap-2">
                                <Send size={16} className="text-blue-500" /> Comunicación y Entregables
                            </div>

                            {/* Lista de Comentarios */}
                            <div className="p-6 space-y-6 max-h-[500px] overflow-y-auto bg-slate-50/20">
                                {task.comments?.length > 0 ? (
                                    task.comments.map((comment: any) => (
                                        <div key={comment.id} className="flex gap-4">
                                            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 border-2 border-white shadow-sm flex-shrink-0">
                                                {comment.user?.name.charAt(0)}
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-sm text-slate-900">{comment.user?.name}</span>
                                                    <span className="text-[10px] text-slate-400 uppercase">{new Date(comment.created_at).toLocaleDateString()}</span>
                                                </div>
                                                <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-slate-200 text-sm text-slate-700 shadow-sm italic leading-snug">
                                                    {comment.body}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-10 space-y-2">
                                        <AlertCircle className="mx-auto text-slate-300" size={32} />
                                        <p className="text-slate-400 text-sm italic">Aún no hay mensajes ni entregas en esta tarea.</p>
                                    </div>
                                )}
                            </div>

                            <form onSubmit={submitComment} className="p-4 bg-white border-t border-slate-100">
                                <div className="relative">
                                    <textarea 
                                        rows={3}
                                        value={data.body}
                                        onChange={e => setData('body', e.target.value)}
                                        className="w-full border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 p-4 transition-all resize-none"
                                        placeholder="Escribe un mensaje al tutor o adjunta tu trabajo..."
                                    />
                                    {errors.body && <p className="text-red-500 text-xs mt-1">{errors.body}</p>}
                                </div>
                                
                                <div className="flex flex-wrap justify-between items-center mt-4 gap-4">
                                    <label className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer transition-colors text-xs font-bold text-slate-600">
                                        <Paperclip size={14} />
                                        <span>{data.deliverable ? (data.deliverable as any).name : "Adjuntar archivo"}</span>
                                        <input 
                                            type="file" 
                                            className="hidden" 
                                            onChange={e => setData('deliverable', e.target.files ? e.target.files[0] : null)}
                                        />
                                    </label>

                                    <button 
                                        type="submit" 
                                        disabled={processing || (!data.body && !data.deliverable)}
                                        className={`${
                                            data.deliverable 
                                                ? 'bg-green-600 hover:bg-green-700' 
                                                : 'bg-blue-600 hover:bg-blue-700'
                                        } text-white px-6 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-md disabled:opacity-50`}
                                    >
                                        {data.deliverable ? 'Entregar Tarea' : 'Enviar Mensaje'} 
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* BARRA LATERAL (DERECHA) */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                            <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2 border-b pb-3">
                                <AlertCircle size={18} className="text-blue-500" /> Información de Seguimiento
                            </h3>
                            
                            <div className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                                        <User size={20} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-slate-400">Becario Asignado</p>
                                        <p className="text-sm font-bold text-slate-700">{task.intern?.name} {task.intern?.last_name}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                                        <Calendar size={20} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-slate-400">Fecha Límite</p>
                                        <p className="text-sm font-bold text-slate-700">{task.due_date ? new Date(task.due_date).toLocaleDateString() : 'Sin fecha establecida'}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                                        <CheckCircle2 size={20} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-slate-400">Estado Actual</p>
                                        <span className="text-xs font-black text-blue-600 uppercase tracking-tighter">
                                            {STATUS_LABELS[task.status] || task.status}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {documents.deliverables.length > 0 && (
                            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                                <h3 className="font-bold text-slate-900 mb-4 text-sm">Archivos Entregados</h3>
                                <div className="space-y-2">
                                    {documents.deliverables.map((file, idx) => (
                                        <a 
                                            key={idx} 
                                            href={file.url} 
                                            target="_blank" 
                                            className="block p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs text-blue-600 hover:underline truncate"
                                        >
                                            {file.name}
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}