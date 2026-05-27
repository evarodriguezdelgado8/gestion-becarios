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
import SearchInput from '@/components/common/SearchInput';
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
                <div className="space-y-2">
                    <div className="break-words text-base font-bold leading-tight text-slate-900">{centro.name}</div>
                    <div className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 font-mono text-[11px] font-bold text-slate-500">CIF: {centro.nif}</div>
                    {centro.web && (
                        <a href={centro.web} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition-colors hover:text-blue-600">
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
                    <div className="flex items-start gap-2 text-base font-bold leading-tight text-slate-900">
                        <User className="mt-1 h-4 w-4 flex-shrink-0 text-slate-400" />
                        <span className="break-words">{centro.contact_name}</span>
                    </div>
                    <div className="mb-2 ml-6 mt-1 text-[11px] font-black uppercase text-slate-400">
                        {centro.contact_role || 'Coordinador'}
                    </div>
                    <div className="ml-6 flex flex-col gap-2 text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                            <a href={`mailto:${centro.contact_email}`} className="flex items-center gap-1.5 break-all font-medium hover:text-blue-600">
                                <Mail className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" /> {centro.contact_email}
                            </a>
                            <button onClick={() => copyToClipboard(centro.contact_email)} className="flex-shrink-0 cursor-pointer rounded-xl bg-slate-100 p-1 text-slate-400 hover:text-blue-500">
                                <Copy className="h-3 w-3" />
                            </button>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" /> {centro.contact_phone}
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
                        className="group flex items-start gap-1.5 font-semibold text-slate-800 transition-colors hover:text-blue-600"
                    >
                        <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-rose-400 group-hover:text-rose-600" />
                        <span className="group-hover:underline break-words">{centro.address}</span>
                    </a>
                    
                    <div className="flex flex-col gap-2 pl-5 text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                            <a href={`mailto:${centro.email}`} className="flex items-center gap-1.5 break-all font-medium hover:text-blue-600">
                                <Mail className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" /> {centro.email}
                            </a>
                            <button onClick={() => copyToClipboard(centro.email)} className="flex-shrink-0 cursor-pointer rounded-xl bg-slate-100 p-1 text-slate-400 hover:text-blue-500">
                                <Copy className="h-3 w-3" />
                            </button>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" /> {centro.phone}
                        </div>
                    </div>
                </div>
            )
        }
    ];

    return (
        <AppLayout breadcrumbs={[{ title: 'Centros Educativos', href: '/centros' }]}>
            <Head title="Centros Educativos" />

            <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-8">
                <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
                    <h2 className="text-2xl font-bold text-gray-800">Centros Educativos</h2>
                    <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto">
                        {/* REEMPLAZO POR COMPONENTE COMÚN */}
                        <SearchInput 
                            value={search}
                            onChange={setSearch}
                            placeholder="Nombre, NIF, email..."
                            className="flex-1 md:w-80"
                        />
                        
                        
                        {isAdmin && (
                            <Link href="/centros/create" className="flex items-center gap-2 whitespace-nowrap rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700">
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
                        <div className="flex flex-col items-center gap-2 py-6 text-slate-400">
                            <AlertCircle className="w-6 h-6" />
                            <span>No se encontraron centros educativos.</span>
                        </div>
                    }
                    actions={(centro: Center) => (
                        <div className="flex justify-end gap-1.5">
                            <Link
                                href={`/centros/${centro.id}`}
                                className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-900 active:scale-95"
                                title="Ver Histórico"
                            >
                                <Eye className="w-4 h-4" />
                            </Link>

                            {isAdmin && (
                                <>
                                    <Link
                                        href={`/centros/${centro.id}/edit`}
                                        className="rounded-xl bg-blue-600 p-2 text-white shadow-sm transition-all hover:bg-blue-700 active:scale-95"
                                        title="Editar"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </Link>

                                    {/* Lógica de borrado condicional */}
                                    {(centro as any).active_interns_count > 0 ? (
                                        <div title="No se puede borrar centros con becarios activos">
                                            <button disabled className="cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 p-2 text-slate-400 opacity-50">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => { setCenterToDelete(centro); setIsDeleting(true); }}
                                            className="cursor-pointer rounded-xl bg-red-600 p-2 text-white shadow-sm transition-all hover:bg-red-700 active:scale-95"
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
