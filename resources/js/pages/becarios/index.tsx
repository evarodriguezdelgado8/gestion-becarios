import { useState, useEffect, useCallback } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout'; 
import { Intern, Pagination } from '@/types';
import { 
    User, Mail, Building2, GraduationCap, 
    Edit2, Trash2, Search, Plus,
    MapPin, Copy, Check,
    Calendar, AlertCircle,
    AlertTriangle, Phone, FileDown, X
} from 'lucide-react';
import { debounce } from 'lodash';
import { toast } from 'sonner';

interface Props {
    interns: Pagination<Intern>;
    filters: { 
        search?: string; 
        status?: string; 
        center_id?: string; 
        from_date?: string; 
        to_date?: string; 
    };
    centers: { id: number; name: string }[];
    flash?: { success?: string; error?: string };
}

export default function Index({ interns, filters, centers, flash }: Props) {   

    const [copiedEmail, setCopiedEmail] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [internToDelete, setInternToDelete] = useState<Intern | null>(null);

    const [params, setParams] = useState({
        search: filters.search || '',
        status: filters.status || '',
        center_id: filters.center_id || '',
        from_date: filters.from_date || '',
        to_date: filters.to_date || '',
    });

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    const copyToClipboard = (email: string, id: number) => {
        navigator.clipboard.writeText(email);
        setCopiedEmail(id);
        toast.success('Email copiado al portapapeles');
        setTimeout(() => setCopiedEmail(null), 2000);
    };    

    const performSearch = useCallback(
        debounce((currentParams) => {
            router.get(
                '/becarios', 
                currentParams, 
                { preserveState: true, replace: true, preserveScroll: true }
            );
        }, 300),
        []
    );

    useEffect(() => {
        performSearch(params);
    }, [params, performSearch]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setParams(prev => ({ ...prev, [name]: value }));
    };

    const resetFilters = () => {
        setParams({ search: '', status: '', center_id: '', from_date: '', to_date: '' });
    };

    const openDeleteModal = (becario: Intern) => {
        setInternToDelete(becario);
        setIsDeleting(true);
    };

    const confirmDelete = () => {
        if (internToDelete) {
            router.delete(`/becarios/${internToDelete.id}`, {
                onSuccess: () => {
                    setIsDeleting(false);
                    setInternToDelete(null);
                },
                onFinish: () => setIsDeleting(false)
            });
        }
    };

    const breadcrumbs = [{ title: 'Becarios', href: '/becarios' }];

    const getExportUrl = () => {
        const queryParams = new URLSearchParams(params as any);
        return `/becarios/export?${queryParams.toString()}`;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Gestión de Becarios" />

            <div className="p-4 md:p-6">
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <h2 className="text-2xl font-bold text-gray-800">Listado de Becarios</h2>
                    
                    <div className="flex w-full md:w-auto gap-3">
                        <a 
                            href={getExportUrl()}
                            className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 text-sm font-medium shadow-sm transition flex items-center gap-2"
                        >
                            <FileDown className="w-4 h-4" />
                            <span className="hidden sm:inline">Exportar</span>
                        </a>

                        <Link 
                            href="/becarios/create"
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium shadow-sm transition flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            <span className="hidden sm:inline">Nuevo Becario</span>
                        </Link>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                        
                        <div className="lg:col-span-2 relative">
                            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Búsqueda</label>
                            <Search className="absolute left-3 top-9 -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input 
                                type="text"
                                name="search"
                                placeholder="Nombre, DNI, email..." 
                                value={params.search}
                                onChange={handleFilterChange}
                                className="border border-gray-300 rounded-lg pl-10 pr-4 py-2 text-sm w-full focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            />
                        </div>

                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Estado</label>
                            <select 
                                name="status"
                                value={params.status}
                                onChange={handleFilterChange}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                            >
                                <option value="">Todos los estados</option>
                                <option value="active">Activo</option>
                                <option value="finished">Finalizado</option>
                                <option value="terminated">Baja</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Centro</label>
                            <select 
                                name="center_id"
                                value={params.center_id}
                                onChange={handleFilterChange}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                            >
                                <option value="">Todos los centros</option>
                                {centers?.map(center => (
                                    <option key={center.id} value={center.id}>{center.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-end">
                            <button 
                                onClick={resetFilters}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-gray-500 hover:text-red-600 transition-colors border border-dashed border-gray-300 rounded-lg hover:border-red-200"
                            >
                                <X className="w-4 h-4" /> Limpiar
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-6 pt-4 border-t border-gray-50">
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <span className="text-[10px] font-bold text-gray-400 uppercase">Desde:</span>
                            <input 
                                type="date"
                                name="from_date"
                                value={params.from_date}
                                onChange={handleFilterChange}
                                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <span className="text-[10px] font-bold text-gray-400 uppercase">Hasta:</span>
                            <input 
                                type="date"
                                name="to_date"
                                value={params.to_date}
                                onChange={handleFilterChange}
                                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-600 table-auto border-collapse">
                            <thead className="bg-gray-50 border-b text-[11px] uppercase tracking-wider font-bold text-gray-500">
                                <tr>
                                    <th className="px-4 py-4 min-w-[220px]">Becario / Datos Personales</th>
                                    <th className="px-4 py-4 min-w-[220px]">Centro y Tutor</th>
                                    <th className="px-4 py-4 min-w-[220px]">Estado y Progreso</th>
                                    <th className="px-4 py-4 w-[140px]"></th>        
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {interns.data.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-gray-500 italic">
                                            <div className="flex flex-col items-center gap-2">
                                                <AlertCircle className="w-6 h-6 text-gray-300" />
                                                <span>No se encontraron becarios con estos filtros.</span>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                                {interns.data.map((becario) => (
                                    <tr key={becario.id} className="hover:bg-blue-50/10 transition-colors">
                                        <td className="px-4 py-4 align-middle">
                                            <div className="flex items-start gap-3">
                                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold flex-shrink-0 mt-1">
                                                    <User className="w-5 h-5" />
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="font-bold text-gray-900 text-base leading-tight">
                                                        <Link 
                                                            href={`/becarios/${becario.id}`} 
                                                            className="hover:text-blue-600 transition-colors"
                                                        >
                                                            {becario.name} {becario.last_name}
                                                        </Link>
                                                    </div>
                                                    <div className="flex flex-col gap-1">
                                                        <div className="text-[12px] text-gray-500 font-mono flex items-center gap-1">
                                                            <span className="font-semibold text-gray-400">DNI:</span> {becario.dni}
                                                        </div>
                                                        <div className="text-[11px] text-gray-400 flex flex-col gap-1">
                                                            <div className="flex items-center gap-1.5">
                                                                <MapPin className="w-3 h-3 flex-shrink-0 text-gray-400" /> 
                                                                {becario.address ? (
                                                                    <span className="truncate max-w-[180px]">{becario.address}</span>
                                                                ) : (
                                                                    <span className="text-gray-400 italic">Sin dirección</span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-1.5 text-gray-500 font-medium">
                                                                <Phone className="w-3 h-3 flex-shrink-0 text-gray-400" /> 
                                                                {becario.phone || 'Sin teléfono'}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-start gap-1 max-w-[200px] mt-1"> 
                                                            <Mail className="w-3 h-3 text-gray-400 mt-1 flex-shrink-0" />
                                                            <a 
                                                                href={`mailto:${becario.email}`} 
                                                                className="text-[12px] text-gray-500 hover:text-blue-600 hover:underline break-all transition-colors"
                                                            >
                                                                {becario.email}
                                                            </a>
                                                            <button 
                                                                onClick={() => copyToClipboard(becario.email, becario.id)}
                                                                className="text-gray-400 hover:text-blue-600 transition-colors ml-1"
                                                            >
                                                                {copiedEmail === becario.id ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-4 py-4 align-middle">
                                            <div className="flex items-start gap-1.5 text-gray-900 font-semibold">
                                                <Building2 className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                                {becario.center ? (
                                                    <Link href={`/centros/${becario.center.id}`} className="hover:text-blue-600 transition-colors">
                                                        {becario.center.name}
                                                    </Link>
                                                ) : <span className="text-gray-400 italic font-normal">Sin centro</span>}
                                            </div>
                                            <div className="text-[11px] text-gray-500 ml-5.5 mt-1 flex items-center gap-1.5 font-medium">
                                                <User className="w-3.5 h-3.5 text-gray-400" />
                                                <span>{becario.academic_tutor || 'Sin tutor'}</span>
                                            </div>
                                            <div className="text-[11px] uppercase font-medium text-gray-500 ml-5.5 mt-1 flex items-center gap-1.5">
                                                <GraduationCap className="w-3.5 h-3.5 text-gray-400" />
                                                {becario.academic_cycle || 'N/A'}
                                            </div>
                                        </td>

                                        <td className="px-4 py-4 align-middle">
                                            <div className="mb-2 flex justify-between items-end text-[11px]">
                                                <span className={`px-2 py-0.5 rounded-full font-bold uppercase ${
                                                    becario.status === 'active' ? 'bg-green-100 text-green-700' : 
                                                    becario.status === 'finished' ? 'bg-blue-100 text-blue-700' : 
                                                    'bg-red-100 text-red-700'
                                                }`}>
                                                    {becario.status}
                                                </span>
                                                <span className="font-mono font-bold text-blue-600">
                                                    {Math.round((becario.completed_hours / (becario.total_hours || 400)) * 100)}%
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                                <div 
                                                    className="bg-blue-500 h-full rounded-full transition-all duration-500"
                                                    style={{ width: `${(becario.completed_hours / (becario.total_hours || 400)) * 100}%` }}
                                                ></div>
                                            </div>
                                            <div className="mt-2 flex flex-col gap-1 text-[10px] text-gray-400 font-medium">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {becario.start_date} - {becario.end_date || 'Final indefinido'}
                                                </div>
                                                <div className="italic">
                                                    {becario.completed_hours} de {becario.total_hours}h totales
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-4 py-4 align-middle text-right">
                                            <div className="flex justify-end gap-1.5">
                                                <Link 
                                                    href={`/becarios/${becario.id}`}
                                                    className="p-2 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg transition-all border border-gray-200"
                                                    title="Ver Perfil"
                                                >
                                                    <User className="w-4 h-4" /> 
                                                </Link>
                                                <Link 
                                                    href={`/becarios/${becario.id}/edit`}
                                                    className="p-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </Link>
                                                <button 
                                                    onClick={() => openDeleteModal(becario)}
                                                    className="p-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-all"
                                                    title="Borrar"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="mt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
                    <p>
                        Mostrando <span className="font-semibold text-gray-800">{interns.data.length}</span> de <span className="font-semibold text-gray-800">{interns.total}</span> becarios
                    </p>
                    <div className="inline-flex shadow-sm rounded-lg overflow-hidden border border-gray-300">
                        <button 
                            disabled={!interns.prev_page_url}
                            onClick={() => router.get(interns.prev_page_url!, params, { preserveState: true })}
                            className="px-4 py-2 bg-white hover:bg-gray-50 disabled:opacity-50 transition border-r font-medium text-gray-700"
                        >
                            Anterior
                        </button>
                        <button 
                            disabled={!interns.next_page_url}
                            onClick={() => router.get(interns.next_page_url!, params, { preserveState: true })}
                            className="px-4 py-2 bg-white hover:bg-gray-50 disabled:opacity-50 transition font-medium text-gray-700"
                        >
                            Siguiente
                        </button>
                    </div>
                </div>
            </div>

            {isDeleting && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-200">
                        <div className="p-6 text-center">
                            <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-red-100 mb-4">
                                <AlertTriangle className="h-7 w-7 text-red-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">¿Eliminar becario?</h3>
                            <p className="text-sm text-gray-500 mt-2">
                                Estás a punto de eliminar a <strong>{internToDelete?.name} {internToDelete?.last_name}</strong>. 
                                Esta acción no se puede deshacer.
                            </p>
                        </div>
                        <div className="bg-gray-50 px-6 py-4 flex gap-3">
                            <button 
                                onClick={() => setIsDeleting(false)}
                                className="flex-1 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-100 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={confirmDelete}
                                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
                            >
                                Sí, eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}