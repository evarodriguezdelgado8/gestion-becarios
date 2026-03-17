import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Center, BreadcrumbItem, Pagination } from '@/types';
import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Edit2, Trash2, Globe, Mail, Phone, MapPin, User, AlertTriangle, History, Copy } from 'lucide-react';
import { debounce } from 'lodash';
import { toast } from 'sonner';

export default function Index({ 
    centers, 
    filters,
    flash = {}
}: { 
    centers: Pagination<Center>, 
    filters: { search: string },
    flash: { success?: string, error?: string }
}) {
    const [search, setSearch] = useState(filters.search || '');
    const [isDeleting, setIsDeleting] = useState(false);
    const [centerToDelete, setCenterToDelete] = useState<Center | null>(null);

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success, { duration: 4000 });
        }
        if (flash?.error) {
            toast.error(flash.error, { duration: 8000 });
        }
    }, [flash]);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.info('Copiado al portapapeles', { 
            icon: <Copy className="w-4 h-4" />,
            duration: 2000 
        });
    };

    const performSearch = useCallback(
        debounce((query: string) => {
            router.get(
                '/centros', 
                { search: query }, 
                { preserveState: true, replace: true, preserveScroll: true }
            );
        }, 300),
        []
    );

    useEffect(() => {
        if (search !== filters.search) {
            performSearch(search);
        }
    }, [search]);

    const openDeleteModal = (centro: Center) => {
        setCenterToDelete(centro);
        setIsDeleting(true);
    };

    const confirmDelete = () => {
        if (centerToDelete) {
            router.delete(`/centros/${centerToDelete.id}`, {
                onSuccess: () => {
                    setIsDeleting(false);
                    setCenterToDelete(null);
                },
                onFinish: () => setIsDeleting(false),
            });
        }
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Centros Educativos', href: '/centros' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Centros Educativos" />

            <div className="p-4 md:p-6">
                
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        Centros Educativos
                    </h2>
                    
                    <div className="flex w-full md:w-auto gap-3">
                        <div className="relative flex-1 md:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input 
                                type="text"
                                placeholder="Nombre, NIF, email..." 
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="border border-gray-300 rounded-lg pl-10 pr-4 py-2 text-sm w-full shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        
                        <button 
                            onClick={() => router.get('/centros/create')}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium shadow-sm transition flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            <span className="hidden sm:inline">Nuevo Centro</span>
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-600 table-auto border-collapse">
                            <thead className="bg-gray-50 border-b text-[11px] uppercase tracking-wider font-bold text-gray-500">
                                <tr>
                                    <th className="px-4 py-4 min-w-[220px]">Institución</th>
                                    <th className="px-4 py-4 min-w-[200px]">Persona de Contacto</th>
                                    <th className="px-4 py-4 min-w-[220px]">Contacto y Dirección</th>
                                    <th className="px-4 py-4 w-[140px]"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {centers.data.length > 0 ? (
                                    centers.data.map((centro) => (
                                        <tr key={centro.id} className="hover:bg-blue-50/10 transition-colors">
                                            <td className="px-4 py-4 align-middle">
                                                <div className="font-bold text-gray-900 text-base leading-tight break-words">
                                                    {centro.name}
                                                </div>
                                                <div className="text-[13px] text-gray-600 mt-1 font-mono">CIF: {centro.nif}</div>
                                                {centro.web && (
                                                    <a href={centro.web} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline flex items-center gap-1.5 text-sm font-medium mt-2">
                                                        <Globe className="w-3.5 h-3.5 flex-shrink-0" /> 
                                                        <span className="break-all">{centro.web.replace('https://', '').replace('http://', '')}</span>
                                                    </a>
                                                )}
                                            </td>

                                            <td className="px-4 py-4 align-middle">
                                                <div className="flex items-start gap-2 text-gray-900 font-bold text-base leading-tight">
                                                    <User className="w-4 h-4 text-blue-500 mt-1 flex-shrink-0" />
                                                    <span className="break-words">{centro.contact_name}</span>
                                                </div>
                                                <div className="text-[11px] uppercase font-bold text-blue-700/70 ml-6 mt-1 mb-2">
                                                    {centro.contact_role || 'Coordinador'}
                                                </div>
                                                <div className="flex flex-col gap-2 text-sm text-gray-600 ml-6">
                                                    <div className="flex items-center gap-2">
                                                        <a href={`mailto:${centro.contact_email}`} className="hover:text-blue-600 hover:underline flex items-center gap-1.5 break-all">
                                                            <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" /> {centro.contact_email}
                                                        </a>
                                                        <button onClick={() => copyToClipboard(centro.contact_email)} className="text-gray-400 hover:text-blue-500 p-1 bg-gray-50 rounded flex-shrink-0">
                                                            <Copy className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" /> {centro.contact_phone}
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-4 py-4 align-middle">
                                                <div className="space-y-3">
                                                    <a 
                                                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(centro.address + ' ' + centro.name)}`}
                                                        target="_blank" rel="noopener noreferrer"
                                                        className="flex items-start gap-1.5 text-gray-800 font-medium hover:text-red-600 group"
                                                    >
                                                        <MapPin className="w-4 h-4 mt-0.5 text-red-400 group-hover:text-red-600 flex-shrink-0" />
                                                        <span className="group-hover:underline break-words">{centro.address}</span>
                                                    </a>
                                                    <div className="flex flex-col gap-2 pl-5 text-sm text-gray-600">
                                                        <div className="flex items-center gap-2">
                                                            <a href={`mailto:${centro.email}`} className="hover:text-blue-600 hover:underline flex items-center gap-1.5 break-all">
                                                                <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" /> {centro.email}
                                                            </a>
                                                            <button onClick={() => copyToClipboard(centro.email)} className="text-gray-400 hover:text-blue-500 p-1 bg-gray-50 rounded flex-shrink-0">
                                                                <Copy className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" /> {centro.phone}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-4 py-4 align-middle text-right">
                                                <div className="flex justify-end gap-1.5">
                                                    <button 
                                                        onClick={() => router.get(`/centros/${centro.id}`)}
                                                        className="p-2 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg transition-all shadow-sm active:scale-95 border border-gray-200"
                                                        title="Ver Histórico"
                                                    >
                                                        <History className="w-4 h-4" />
                                                    </button>

                                                    <button 
                                                        onClick={() => router.get(`/centros/${centro.id}/edit`)}
                                                        className="p-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-all shadow-sm active:scale-95"
                                                        title="Editar"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    {(centro as any).active_interns_count > 0 ? (
                                                        <div className="relative group/tooltip inline-block">
                                                            <button disabled className="p-2 bg-gray-100 text-gray-400 border border-gray-200 rounded-lg opacity-50 cursor-not-allowed">
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                            <div className="absolute bottom-full mb-2 right-0 hidden group-hover/tooltip:block w-40 p-2 bg-gray-800 text-white text-[10px] rounded shadow-lg z-10 text-center leading-tight">
                                                                Becarios activos asignados.
                                                                <div className="absolute top-full right-3 border-4 border-transparent border-t-gray-800"></div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <button 
                                                            onClick={() => openDeleteModal(centro)}
                                                            className="p-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-all shadow-sm active:scale-95"
                                                            title="Borrar Centro"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-gray-400 italic">No hay centros que coincidan.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="mt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
                    <p>Mostrando {centers.data.length} de {centers.total} centros registrados</p>
                    <div className="inline-flex shadow-sm rounded-lg overflow-hidden border border-gray-300">
                        <button 
                            disabled={!centers.prev_page_url}
                            onClick={() => router.get(centers.prev_page_url!)}
                            className="px-4 py-2 bg-white hover:bg-gray-50 disabled:opacity-50 transition border-r font-medium"
                        >
                            Anterior
                        </button>
                        <button 
                            disabled={!centers.next_page_url}
                            onClick={() => router.get(centers.next_page_url!)}
                            className="px-4 py-2 bg-white hover:bg-gray-50 disabled:opacity-50 transition font-medium"
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
                            <h3 className="text-xl font-bold text-gray-900">¿Eliminar centro?</h3>
                            <p className="text-sm text-gray-500 mt-2">
                                Estás a punto de eliminar <strong>{centerToDelete?.name}</strong>. 
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
                                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 shadow-lg shadow-red-200 transition-colors"
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