import { Head, router, usePage, Link } from '@inertiajs/react';
import { debounce } from 'lodash';
import { 
    Plus, Edit2, Trash2, Globe, Mail, Phone, 
    MapPin, User, Eye, Copy, AlertCircle 
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';

// Componentes Comunes
import DataTable from '@/components/common/DataTable';
import DeleteConfirmModal from '@/components/common/DeleteConfirmModal';
import SearchInput from '@/components/common/SearchInput'; // <-- Nuevo
import AppLayout from '@/layouts/app-layout';

import type { Center, Pagination } from '@/types';

export default function Index({
    centers,
    filters,
    flash = {}
}: {
    centers: Pagination<Center>,
    filters: { search: string },
    flash: { success?: string, error?: string }
}) {
    const { auth } = usePage().props as any;
    const isAdmin = auth.user?.roles?.some((r: any) => {
        const roleName = typeof r === 'object' ? r.name : r;
        return roleName?.toLowerCase().includes('admin');
    });

    const [search, setSearch] = useState(filters.search || '');
    const [isDeleting, setIsDeleting] = useState(false);
    const [centerToDelete, setCenterToDelete] = useState<Center | null>(null);

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.info('Copiado al portapapeles', { icon: <Copy className="w-4 h-4" /> });
    };

    const performSearch = useMemo(() =>
        debounce((query: string) => {
            router.get('/centros', { search: query }, { preserveState: true, replace: true, preserveScroll: true });
        }, 300), []
    );

    useEffect(() => {
        if (search !== filters.search) performSearch(search);
    }, [search, filters.search, performSearch]);

    const confirmDelete = () => {
        if (centerToDelete) {
            router.delete(`/centros/${centerToDelete.id}`, {
                onSuccess: () => {
                    setIsDeleting(false);
                    setCenterToDelete(null);
                },
            });
        }
    };

    const columns = [
        {
            header: 'Institución',
            render: (centro: Center) => (
                <div className="py-1">
                    <div className="font-bold text-gray-900 text-base leading-tight break-words">{centro.name}</div>
                    <div className="text-[13px] text-gray-600 mt-1 font-mono">CIF: {centro.nif}</div>
                    {centro.web && (
                        <a href={centro.web} target="_blank" rel="noreferrer" className="text-gray-500 hover:text-blue-600 flex items-center gap-1.5 text-sm font-medium mt-2 transition-colors">
                            <Globe className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="break-all">{centro.web.replace(/https?:\/\//, '')}</span>
                        </a>
                    )}
                </div>
            )
        },
        {
            header: 'Persona de Contacto',
            render: (centro: Center) => (
                <div>
                    <div className="flex items-start gap-2 text-gray-900 font-bold text-base leading-tight">
                        <User className="w-4 h-4 text-gray-500 mt-1 flex-shrink-0" />
                        <span className="break-words">{centro.contact_name}</span>
                    </div>
                    <div className="text-[11px] uppercase font-bold text-gray-700/70 ml-6 mt-1 mb-2">
                        {centro.contact_role || 'Coordinador'}
                    </div>
                    <div className="flex flex-col gap-2 text-sm text-gray-600 ml-6">
                        <div className="flex items-center gap-2">
                            <a href={`mailto:${centro.contact_email}`} className="hover:text-blue-600 flex items-center gap-1.5 break-all">
                                <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" /> {centro.contact_email}
                            </a>
                            <button onClick={() => copyToClipboard(centro.contact_email)} className="text-gray-400 hover:text-blue-500 p-1 bg-gray-50 rounded flex-shrink-0 cursor-pointer">
                                <Copy className="w-3 h-3" />
                            </button>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" /> {centro.contact_phone}
                        </div>
                    </div>
                </div>
            )
        },
        {
            header: 'Contacto y Dirección',
            render: (centro: Center) => (
                <div className="space-y-3">
                    <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(centro.address + ' ' + centro.name)}`}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-start gap-1.5 text-gray-800 font-medium hover:text-blue-600 group transition-colors"
                    >
                        <MapPin className="w-4 h-4 mt-0.5 text-red-400 group-hover:text-red-600 flex-shrink-0" />
                        <span className="group-hover:underline break-words">{centro.address}</span>
                    </a>
                    
                    <div className="flex flex-col gap-2 pl-5 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                            <a href={`mailto:${centro.email}`} className="hover:text-blue-600 flex items-center gap-1.5 break-all">
                                <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" /> {centro.email}
                            </a>
                            <button onClick={() => copyToClipboard(centro.email)} className="text-gray-400 hover:text-blue-500 p-1 bg-gray-50 rounded flex-shrink-0 cursor-pointer">
                                <Copy className="w-3 h-3" />
                            </button>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" /> {centro.phone}
                        </div>
                    </div>
                </div>
            )
        }
    ];

    return (
        <AppLayout breadcrumbs={[{ title: 'Centros Educativos', href: '/centros' }]}>
            <Head title="Centros Educativos" />

            <div className="p-4 md:p-6">
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <h2 className="text-2xl font-bold text-gray-800">Centros Educativos</h2>
                    <div className="flex w-full md:w-auto gap-3">
                        {/* REEMPLAZO POR COMPONENTE COMÚN */}
                        <SearchInput 
                            value={search}
                            onChange={setSearch}
                            placeholder="Nombre, NIF, email..."
                            className="flex-1 md:w-80"
                        />
                        
                        {isAdmin && (
                            <Link href="/centros/create" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium shadow-sm transition flex items-center gap-2 whitespace-nowrap">
                                <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Nuevo Centro</span>
                            </Link>
                        )}
                    </div>
                </div>

                <DataTable 
                    data={centers.data}
                    columns={columns}
                    pagination={centers}
                    params={{ search }}
                    emptyMessage={
                        <div className="flex flex-col items-center gap-2 py-6 text-gray-400 italic">
                            <AlertCircle className="w-6 h-6" />
                            <span>No se encontraron centros educativos.</span>
                        </div>
                    }
                    actions={(centro: Center) => (
                        <div className="flex justify-end gap-1.5">
                            <Link 
                                href={`/centros/${centro.id}`} 
                                className="p-2 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg transition-all active:scale-95 border border-gray-200"
                                title="Ver Histórico"
                            >
                                <Eye className="w-4 h-4" />
                            </Link>

                            {isAdmin && (
                                <>
                                    <Link 
                                        href={`/centros/${centro.id}/edit`} 
                                        className="p-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-all active:scale-95 shadow-sm"
                                        title="Editar"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </Link>

                                    {/* Lógica de borrado condicional */}
                                    {(centro as any).active_interns_count > 0 ? (
                                        <div title="No se puede borrar centros con becarios activos">
                                            <button disabled className="p-2 bg-gray-100 text-gray-400 border border-gray-200 rounded-lg opacity-50 cursor-not-allowed">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={() => { setCenterToDelete(centro); setIsDeleting(true); }}
                                            className="p-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-all active:scale-95 shadow-sm cursor-pointer"
                                            title="Borrar Centro"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                />
            </div>
        
            <DeleteConfirmModal 
                isOpen={isDeleting}
                onClose={() => setIsDeleting(false)}
                onConfirm={confirmDelete}
                title="¿Eliminar centro?"
                itemName={centerToDelete?.name}
            />
        </AppLayout>
    );
}