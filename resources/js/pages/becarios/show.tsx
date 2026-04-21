import { Head, Link } from '@inertiajs/react';
import { 
    User, BookOpen, Calendar, 
    ArrowLeft, Download, FileText, 
    Clock, MapPin, Mail, Phone, Building2,
    ShieldCheck, Info, Copy, ClipboardList
} from 'lucide-react';
import { toast } from 'sonner';
import AppLayout from '@/layouts/app-layout';
import type { Intern, BreadcrumbItem } from '@/types';

interface Props {
    intern: Intern;
    documents: {
        dni: string | null;
        convenio: string | null;
        seguro: string | null;
    };
}

export default function Show({ intern, documents }: Props) {
    const formatDate = (dateString: string | null) => {
        if (!dateString) return null;
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('es-ES').format(date);
    };



    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Becarios', href: '/becarios' },
        { title: `${intern.name} ${intern.last_name}`, href: '#' },
    ];

    const copyToClipboard = (email: string) => {
        navigator.clipboard.writeText(email);
        toast.info('Copiado al portapapeles', {
            className: 'bg-blue-50 text-blue-700 border-blue-200',
            icon: <Copy className="w-4 h-4 text-blue-600" />,
        });
    };

    const progress = Math.min(100, Math.round((intern.completed_hours / (intern.total_hours || 400)) * 100));

    const statusConfig = {
        active: { 
            label: 'Activo', 
            styles: 'bg-green-100 text-green-700 border-green-200' 
        },
        finished: { 
            label: 'Finalizado', 
            styles: 'bg-blue-100 text-blue-700 border-blue-200' 
        },
        abandoned: { 
            label: 'Abandonado', 
            styles: 'bg-red-100 text-red-700 border-red-200' 
        },
    };

    const currentStatus = statusConfig[intern.status as keyof typeof statusConfig] || statusConfig.abandoned;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Perfil - ${intern.name}`} />

            <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">

                <div className="flex justify-start">
                <button 
                    onClick={() => window.history.back()} 
                    className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors mb-4 bg-blue-50 px-3 py-1.5 rounded-lg cursor-pointer"
                >
                    <ArrowLeft className="w-4 h-4" /> Volver al listado
                </button>
                </div>
                
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 flex-shrink-0 hidden sm:flex">
                            <User className="w-8 h-8" />
                        </div>
                        
                        <div className="min-w-0">
                            <div className="flex items-center gap-3 flex-nowrap">
                                <h2 className="text-2xl font-bold text-gray-900 truncate">
                                    {intern.name} {intern.last_name}
                                </h2>
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase border flex-shrink-0 whitespace-nowrap ${currentStatus.styles}`}>
                                    {currentStatus.label}
                                </span>
                            </div>
                            <p className="text-gray-500 text-sm font-mono truncate mt-1">DNI: {intern.dni}</p>
                        </div>
                    </div>

                    <div className="flex-shrink-0">
                        <Link 
                            href={`/becarios/${intern.id}/edit`} 
                            className="whitespace-nowrap px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-sm active:scale-95 text-sm"
                        >
                            Editar Perfil
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-6">
                        
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                            <h3 className="font-bold uppercase text-gray-900 mb-4 flex items-center gap-2">
                                <Info className="w-4 h-4 text-gray-900" /> Información de contacto
                            </h3>
                            <div className="flex flex-col gap-y-4">
                                <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
                                    <div className="flex items-center gap-3 text-gray-700 min-w-fit group">
                                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                                            <Mail className="w-4 h-4 text-blue-500" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-gray-400 font-bold uppercase">Email</span>
                                            <div className="flex items-center gap-2">
                                                <a href={`mailto:${intern.email}`} className="text-sm hover:text-blue-600 break-all font-medium transition-colors">
                                                    {intern.email}
                                                </a>
                                                <button 
                                                    onClick={() => copyToClipboard(intern.email)}
                                                    className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-blue-500 transition-all cursor-pointer active:scale-90"
                                                    title="Copiar email"
                                                >
                                                    <Copy className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 text-gray-700 min-w-fit">
                                        <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                                            <Phone className="w-4 h-4 text-green-600" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-gray-400 font-bold uppercase">Teléfono</span>
                                            <span className="text-sm font-medium">{intern.phone || 'No aportado'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-2 border-t border-gray-50 flex items-start gap-3 text-gray-700">
                                    <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                                        <MapPin className="w-4 h-4 text-red-500" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-gray-400 font-bold uppercase">Ubicación</span>
                                        {intern.address ? (
                                            <a 
                                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(intern.address)}`}
                                                target="_blank" rel="noopener noreferrer"
                                                className="text-sm hover:text-blue-600 hover:underline transition-colors font-medium"
                                            >
                                                {intern.address}
                                            </a>
                                        ) : <span className="text-sm text-gray-400">Sin dirección</span>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                            <h3 className="font-bold uppercase text-gray-900 mb-4 flex items-center gap-2">
                                <ClipboardList className="w-4 h-4 text-gray-900" /> Detalles del Centro y Tutoría
                            </h3>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="flex items-start gap-3">
                                    <Building2 className="w-5 h-5 text-gray-400 mt-1" />
                                    <div>
                                        {intern.center ? (
                                            <Link href={`/centros/${intern.center.id}`} className="font-bold text-gray-900 hover:text-blue-600 transition-colors">
                                                {intern.center.name}
                                            </Link>
                                        ) : <p className="font-bold text-gray-900">Sin centro asignado</p>}
                                        <p className="text-[10px] text-gray-400 uppercase font-bold">Centro de formación</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <User className="w-5 h-5 text-gray-400 mt-1" />
                                    <div>
                                        <p className="font-bold text-gray-900">{intern.academic_tutor || 'No asignado'}</p>
                                        <p className="text-[10px] text-gray-400 uppercase font-bold">Tutor Académico</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <BookOpen className="w-5 h-5 text-gray-400 mt-1" />
                                    <div>
                                        <p className="font-bold text-gray-900">{intern.academic_cycle || 'No especificado'}</p>
                                        <p className="text-[10px] text-gray-400 uppercase font-bold">Ciclo Formativo</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Calendar className="w-5 h-5 text-gray-400 mt-1" />
                                    <div>
                                        <p className="font-bold text-gray-900">
                                            {formatDate(intern.start_date)} - {formatDate(intern.end_date) || 'Fin indefinido'}
                                        </p>
                                        <p className="text-[10px] text-gray-400 uppercase font-bold">Periodo de Prácticas</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                            <h3 className="font-bold uppercase text-gray-900 mb-4 flex items-center gap-2">
                                <Clock className="w-4 h-4 text-gray-900" /> Progreso de Horas
                            </h3>
                            <div className="text-3xl font-black text-blue-600 mb-1">
                                {intern.completed_hours} <span className="text-sm text-gray-400 font-normal">/ {intern.total_hours}h totales</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-3 mt-4 overflow-hidden border border-gray-50">
                                <div 
                                    className="bg-blue-600 h-full rounded-full transition-all duration-700 ease-out" 
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>
                            <p className="text-right text-[11px] font-bold text-blue-600 mt-2">{progress}% COMPLETADO</p>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                            <h3 className="font-bold uppercase text-gray-900 mb-4 flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-gray-900" /> Documentación
                            </h3>
                            <div className="space-y-3">
                                <DocItem label="DNI Escaneado" url={documents.dni} color="text-red-500" />
                                <DocItem label="Convenio de Prácticas" url={documents.convenio} color="text-blue-500" />
                                <DocItem label="Seguro" url={documents.seguro} color="text-green-600" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

function DocItem({ label, url, color }: { label: string, url: string | null, color: string }) {
    if (!url) return (
        <div className="text-[11px] text-gray-400 p-3 border border-dashed rounded-xl bg-gray-50/50 flex flex-col items-center gap-1">
            <span>{label} pendiente</span>
        </div>
    );

    const fileName = url.split('/').pop() || `${label.replace(/\s+/g, '_')}`;

    return (
        <a 
            href={url} 
            download={fileName}
            className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl hover:border-blue-300 transition-all group cursor-pointer"
            title={`Descargar ${label}`}
        >
            <span className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                <FileText className={`w-4 h-4 ${color}`}/> {label}
            </span>
            <div className="p-1 group-hover:bg-blue-50 rounded-md transition-colors">
                <Download className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
            </div>
        </a>
    );
}