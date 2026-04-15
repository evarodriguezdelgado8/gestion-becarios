import React, { useState } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { 
    Calendar, User, ArrowLeft, FileText, Send, 
    Paperclip, CheckCircle2, Clock, History, Plus, MessageSquare,
    Edit3, Trash2
} from 'lucide-react';
import { toast } from 'sonner';

// Importación de tus componentes modales
import TaskFormModal from './taskFormModal';
import DeleteTaskModal from './deleteTaskModal';

interface Props {
    task: any;
    activityLog: Array<{
        id: number;
        description: string;
        user: string;
        date: string;
        properties?: any;
        translation?: string;
    }>;
    documents: {
        specifications: string | null;
        deliverables: Array<{ url: string; name: string }>;
    };
    interns: any[];
    centers: any[];
}

export default function Show({ task, activityLog, documents, interns, centers }: Props) {
    const { auth } = usePage().props as any;
    
    const [activeTab, setActiveTab] = useState<'chat' | 'history'>('chat');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const chatForm = useForm({ body: '' });
    const deliveryForm = useForm({ deliverable: null as File | null });

    const submitComment = (e: React.SyntheticEvent) => {
        e.preventDefault();
        chatForm.post(`/tareas/${task.id}/comments`, {
            onSuccess: () => { chatForm.reset('body'); toast.success('Mensaje enviado'); },
        });
    };

    const submitDelivery = (e: React.SyntheticEvent) => {
        e.preventDefault();
        if (!deliveryForm.data.deliverable) return;
        deliveryForm.post(`/tareas/${task.id}/deliveries`, {
            forceFormData: true,
            onSuccess: () => { deliveryForm.reset('deliverable'); toast.success('Archivo entregado'); },
        });
    };

    const PRIORITY_LABELS: Record<string, string> = { urgent: 'Urgente', high: 'Alta', medium: 'Media', low: 'Baja' };
    const STATUS_LABELS: Record<string, string> = { pending: 'Pendiente', in_progress: 'En Progreso', in_review: 'En Revisión', completed: 'Completada', rejected: 'Rechazada' };

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
        <AppLayout breadcrumbs={[{ title: 'Tablero', href: '/tareas' }, { title: 'Detalle', href: '#' }]}>
            <Head title={task.title} />

            <div className="w-full bg-slate-50/30 min-h-screen">
                <div className="max-w-[1400px] mx-auto p-6 lg:p-10 space-y-6">
                    
                    <div className="flex justify-between items-center mb-2">
                        <Link href="/tareas" className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors font-medium text-sm">
                            <ArrowLeft size={16} /> Volver al tablero de tareas
                        </Link>
                    </div>

                    <div className="grid grid-cols-3 gap-8">
                        
                        {/* COLUMNA IZQUIERDA Y CENTRAL (2/3) */}
                        <div className="col-span-2 space-y-6">
                            
                            {/* Información Tarea */}
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="space-y-1">
                                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{task.title}</h1>
                                        <div className="flex items-center gap-2 text-slate-500 text-sm">
                                            <Clock size={14} /> <span>Creada por {task.creator?.name}</span>
                                        </div>
                                    </div>
                                    <div className={`px-4 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wider ${getPriorityColor(task.priority)}`}>
                                        {PRIORITY_LABELS[task.priority]}
                                    </div>
                                </div>

                                <div className="prose prose-slate max-w-none">
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Descripción</h3>
                                    <p className="text-slate-700 leading-relaxed whitespace-pre-wrap bg-slate-50 p-4 rounded-xl border border-slate-100">
                                        {task.description || "Sin descripción detallada."}
                                    </p>
                                </div>

                                {documents.specifications && (
                                    <div className="mt-8 pt-6 border-t border-slate-100">
                                        <a href={documents.specifications} target="_blank" className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-100 hover:bg-blue-100 transition-colors group">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-blue-600 text-white p-2 rounded-lg shadow-sm"><FileText size={20} /></div>
                                                <span className="font-bold text-blue-900 text-sm group-hover:underline">Descargar Guía de la Tarea</span>
                                            </div>
                                            <Paperclip size={18} className="text-blue-400" />
                                        </a>
                                    </div>
                                )}
                            </div>

                            {/* SISTEMA DE PESTAÑAS (Tabs) */}
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[600px]">
                                <div className="flex border-b bg-slate-50/50 px-4">
                                    <button 
                                        onClick={() => setActiveTab('chat')}
                                        className={`px-6 py-4 text-sm font-bold flex items-center gap-2 transition-all border-b-2 ${activeTab === 'chat' ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                                    >
                                        <MessageSquare size={18} /> Chat de Equipo
                                    </button>
                                    <button 
                                        onClick={() => setActiveTab('history')}
                                        className={`px-6 py-4 text-sm font-bold flex items-center gap-2 transition-all border-b-2 ${activeTab === 'history' ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                                    >
                                        <History size={18} /> Historial de Cambios
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-6 bg-slate-50/20">
                                    {activeTab === 'chat' ? (
                                        <div className="flex flex-col gap-4">
                                            {task.comments && [...task.comments].reverse().map((comment: any) => {
                                                const isMe = comment.user_id === auth.user.id;
                                                return (
                                                    <div key={comment.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                        <div className={`max-w-[80%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                                                            <div className={`flex items-center gap-2 px-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                                                                <span className="text-[10px] font-black text-slate-500 uppercase">{isMe ? 'Tú' : comment.user?.name}</span>
                                                                <span className="text-[9px] text-slate-300">{new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                            </div>
                                                            <div className={`p-4 rounded-2xl text-sm shadow-sm border ${isMe ? 'bg-blue-600 text-white border-blue-500 rounded-tr-none font-medium' : 'bg-white text-slate-700 border-slate-200 rounded-tl-none font-medium'}`}>
                                                                {comment.body}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="relative before:absolute before:left-[11px] before:top-0 before:h-full before:w-0.5 before:bg-slate-100">
                                            {[...activityLog].reverse().map((log: any) => {
                                                const data = log.attribute_changes || log.properties || {};
                                                const attributes = data.attributes || {};
                                                const old = data.old || {}; 

                                                return (
                                                    <div key={log.id} className="relative pl-10 pb-8 last:pb-2">
                                                        <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-white border-4 border-blue-500 shadow-sm z-10" />
                                                        <div className="space-y-1">
                                                            <p className="text-sm font-bold text-slate-800 leading-tight">
                                                                {log.description === 'created' ? (
                                                                    "Tarea creada"
                                                                ) : attributes.status ? (
                                                                    <>
                                                                        Movida de <span className="text-slate-400 font-medium">{STATUS_LABELS[old.status] || '...'}</span> a <span className="text-blue-600">{STATUS_LABELS[attributes.status]}</span>
                                                                    </>
                                                                ) : (
                                                                    log.translation || "Tarea actualizada"
                                                                )}
                                                            </p>
                                                            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                                                <span className="text-blue-600">{log.user}</span>
                                                                <span>•</span>
                                                                <span>{log.date}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {activeTab === 'chat' && (
                                    <form onSubmit={submitComment} className="p-4 bg-white border-t border-slate-100 flex gap-4">
                                        <input 
                                            type="text"
                                            value={chatForm.data.body}
                                            onChange={e => chatForm.setData('body', e.target.value)}
                                            className="flex-1 border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 p-3 bg-slate-50"
                                            placeholder="Escribe un mensaje..."
                                        />
                                        <button disabled={chatForm.processing} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-md">
                                            <Send size={14} /> Enviar
                                        </button>
                                    </form>
                                )}
                            </div>
                        </div>

                        {/* COLUMNA DERECHA (1/3) */}
                        <div className="space-y-6">
                            
                            {/* BOTONES DE ACCIÓN */}
                            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex gap-3">
                                <button 
                                    onClick={() => setIsEditModalOpen(true)}
                                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold hover:bg-blue-100 hover:text-blue-700 transition-all border border-blue-100"
                                >
                                    <Edit3 size={16} /> 
                                    <span>Editar</span>
                                </button>
                                
                                <button 
                                    onClick={() => setIsDeleteModalOpen(true)}
                                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-50 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100 hover:text-red-700 transition-all border border-red-100"
                                >
                                    <Trash2 size={16} /> 
                                    <span>Borrar</span>
                                </button>
                            </div>

                            {/* SEGUIMIENTO */}
                            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                                <h3 className="font-bold text-slate-900 mb-6 border-b pb-3 text-sm uppercase tracking-tight">Seguimiento</h3>
                                <div className="space-y-5">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500"><User size={20} /></div>
                                        <div>
                                            <p className="text-[10px] uppercase font-bold text-slate-400">Responsable</p>
                                            <p className="text-sm font-bold text-slate-700">{task.intern?.name} {task.intern?.last_name}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500"><Calendar size={20} /></div>
                                        <div>
                                            <p className="text-[10px] uppercase font-bold text-slate-400">Fecha Límite</p>
                                            <p className="text-sm font-bold text-slate-700">{task.due_date || 'Sin definir'}</p>
                                        </div>
                                    </div>
                                    <div className="pt-4">
                                        <div className="p-3 rounded-xl text-center text-xs font-black text-blue-600 bg-blue-50 border border-blue-100 uppercase">
                                            {STATUS_LABELS[task.status]}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ENTREGABLES COMPACTO */}
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="p-4 border-b bg-slate-50 font-bold text-slate-700 text-xs flex items-center gap-2 uppercase">
                                    <CheckCircle2 size={14} className="text-green-500" /> Entregables
                                </div>
                                <div className="p-5 space-y-4">
                                    <form onSubmit={submitDelivery} className="space-y-2">
                                        <label className="flex items-center gap-3 p-3 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100 transition-all cursor-pointer group">
                                            <Plus size={16} className="text-slate-400 group-hover:text-blue-500" />
                                            <span className="text-[11px] font-bold text-slate-500 uppercase truncate">
                                                {deliveryForm.data.deliverable ? (deliveryForm.data.deliverable as any).name : "Añadir archivo"}
                                            </span>
                                            <input type="file" className="hidden" onChange={e => deliveryForm.setData('deliverable', e.target.files ? e.target.files[0] : null)} />
                                        </label>
                                        {deliveryForm.data.deliverable && (
                                            <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-xl text-[10px] font-black uppercase transition-all shadow-md">
                                                Subir Entrega
                                            </button>
                                        )}
                                    </form>

                                    <div className="space-y-2">
                                        {documents.deliverables.map((file, idx) => (
                                            <a key={idx} href={file.url} target="_blank" className="flex items-center gap-2 p-2 bg-white border border-slate-100 rounded-lg text-[11px] text-blue-600 hover:bg-blue-50 transition-all truncate">
                                                <FileText size={14} /> <span className="truncate">{file.name}</span>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>

            {/* MODALES */}
            <TaskFormModal 
                isOpen={isEditModalOpen} 
                onClose={() => setIsEditModalOpen(false)} 
                task={task}
                interns={interns}
                centers={centers}
            />

            <DeleteTaskModal 
                isOpen={isDeleteModalOpen} 
                onClose={() => setIsDeleteModalOpen(false)} 
                task={task} 
            />
        </AppLayout>
    );
}