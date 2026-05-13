import { Head, router, Link, usePage } from '@inertiajs/react';
import { format } from "date-fns";
import { debounce } from 'lodash';
import { 
    User, Mail, Building2, GraduationCap, 
    Edit2, Trash2, Plus,
    Copy, Check, Calendar as CalendarIcon, AlertCircle,
    Phone, FileDown, X
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';

import type { Column } from '@/components/common/DataTable';
import DataTable from '@/components/common/DataTable';
import DeleteConfirmModal from '@/components/common/DeleteConfirmModal';
import SearchInput from '@/components/common/SearchInput';

// Importamos tus componentes de UI
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar"; 
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import AppLayout from '@/layouts/app-layout'; 
import { cn } from "@/lib/utils";

import type { Intern, Pagination } from '@/types';

interface Props {
    interns: Pagination<Intern>;
    filters: { 
        search?: string; 
        status?: string; 
        center_id?: string; 
        start_from?: string; 
        start_to?: string;
        end_from?: string;
        end_to?: string;
    };
    centers: { id: number; name: string }[];
    flash?: { success?: string; error?: string };
}

const statusMap: Record<string, { label: string; class: string }> = {
    'active': { label: 'Activo', class: 'bg-green-100 text-green-700' },
    'finished': { label: 'Finalizado', class: 'bg-blue-100 text-blue-700' },
    'abandoned': { label: 'Abandonado', class: 'bg-red-100 text-red-700' },
};

const FilterDatePicker = ({
    name,
    value,
    label,
    onChange,
}: {
    name: string;
    value: string;
    label: string;
    onChange: (name: string, value: string) => void;
}) => (
    <div>
        <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">{label}</label>
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    className={cn(
                        "w-full justify-start text-left font-normal h-[38px] border-gray-300 rounded-lg text-sm",
                        !value && "text-gray-900"
                    )}
                >
                    <CalendarIcon className="mr-2 h-3.5 w-3.5 text-gray-400" />
                    {value ? format(new Date(value), "dd/MM/yyyy") : <span>dd/mm/aaaa</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    selected={value ? new Date(value) : undefined}
                    onSelect={(date) => onChange(name, date ? format(date, "yyyy-MM-dd") : '')}
                />
            </PopoverContent>
        </Popover>
    </div>
);

export default function Index({ interns, filters, centers, flash }: Props) {   
    const { auth } = usePage().props as any;
    const isAdmin = auth.user?.roles?.some((r: any) => {
        const roleName = typeof r === 'object' ? r.name : r;
        return roleName?.toLowerCase().includes('admin');
    });

    const [copiedEmail, setCopiedEmail] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [internToDelete, setInternToDelete] = useState<Intern | null>(null);

    const [params, setParams] = useState({
        search: filters.search || '',
        status: filters.status || '',
        center_id: filters.center_id || '',
        start_from: filters.start_from || '',
        start_to: filters.start_to || '',
        end_from: filters.end_from || '',
        end_to: filters.end_to || '',
    });

    /*useEffect(() => {
        setParams({
            search: filters.search || '',
            status: filters.status || '',
            center_id: filters.center_id || '',
            start_from: filters.start_from || '',
            start_to: filters.start_to || '',
            end_from: filters.end_from || '',
            end_to: filters.end_to || '',
        });
    }, [filters]);
    */

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    const performSearch = useMemo(() =>
        debounce((newParams) => {
            router.get('/becarios', newParams, { 
                preserveState: true, 
                replace: true, 
                preserveScroll: true 
            });
        }, 300),
        []
    );

    const handleFilterChange = (name: string, value: string) => {
        const newParams = { ...params, [name]: value };
        setParams(newParams);
        
        if (name === 'search') {
            performSearch(newParams);
        } else {
            router.get('/becarios', newParams, { 
                preserveState: true, 
                replace: true,
                preserveScroll: true 
            });
        }
    };

    const resetFilters = () => {
        const empty = { 
            search: '', status: '', center_id: '', 
            start_from: '', start_to: '', 
            end_from: '', end_to: '' 
        };
        setParams(empty);
        router.get('/becarios', empty);
    };

    const formatDateDisplay = (dateString: string | null) => {
        if (!dateString) return 'Indefinido';
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
    };

    

    const columns: Column<Intern>[] = [
        {
            header: 'Becario / Datos Personales',
            className: 'min-w-[220px]',
            render: (becario) => (
                <div className="flex items-start gap-3 py-1">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold flex-shrink-0 mt-1">
                        <User className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                        <Link href={`/becarios/${becario.id}`} className="font-bold text-gray-900 text-base hover:text-blue-600 transition-colors leading-tight">
                            {becario.name} {becario.last_name}
                        </Link>
                        <div className="text-[13px] text-gray-600 font-mono">
                            <span className="font-semibold text-gray-400">DNI:</span> {becario.dni}
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                            <Phone className="w-3.5 h-3.5 text-gray-400" /> {becario.phone || 'N/A'}
                        </div>
                        <div className="flex items-center gap-1">
                            <Mail className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-sm text-gray-600 truncate max-w-[140px]">{becario.email}</span>
                            <button onClick={() => {
                                navigator.clipboard.writeText(becario.email);
                                setCopiedEmail(becario.id);
                                toast.info('Copiado al portapapeles');
                                setTimeout(() => setCopiedEmail(null), 2000);
                            }} className="text-gray-400 hover:text-blue-600 p-1 cursor-pointer">
                                {copiedEmail === becario.id ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                            </button>
                        </div>
                    </div>
                </div>
            )
        },
        {
            header: 'Centro y Tutor',
            className: 'min-w-[220px]',
            render: (becario) => (
                <div className="space-y-1 py-1">
                    <div className="flex items-start gap-1.5 text-gray-900 font-bold text-base leading-tight">
                        <Building2 className="w-4 h-4 text-gray-500 mt-1 flex-shrink-0" />
                        {becario.center ? (
                            <Link href={`/centros/${becario.center.id}`} className="hover:text-blue-600 transition-colors break-words">
                                {becario.center.name}
                            </Link>
                        ) : <span className="text-gray-400 italic font-normal text-sm">Sin centro</span>}
                    </div>
                    <div className="text-[13px] text-gray-700/70 flex items-center gap-1.5 ml-6 font-bold uppercase">
                        <User className="w-3.5 h-3.5 text-gray-400" /> {becario.academic_tutor || 'Sin tutor'}
                    </div>
                    <div className="text-sm font-medium text-gray-600 flex items-center gap-1.5 ml-6">
                        <GraduationCap className="w-4 h-4 text-gray-400" /> {becario.academic_cycle || 'N/A'}
                    </div>
                </div>
            )
        },
        {
            header: 'Estado y Progreso',
            className: 'min-w-[200px]',
            render: (becario) => {
                const statusInfo = statusMap[becario.status] || { label: becario.status, class: 'bg-gray-100 text-gray-600' };
                const progress = Math.round((becario.completed_hours / (becario.total_hours || 400)) * 100);
                return (
                    <div className="space-y-2 py-1">
                        <div className="flex justify-between items-end text-[11px]">
                            <span className={`px-2 py-0.5 rounded-full font-bold uppercase ${statusInfo.class}`}>
                                {statusInfo.label}
                            </span>
                            <span className="font-mono font-bold text-blue-600">{progress}%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                            <div className="bg-blue-500 h-full transition-all" style={{ width: `${progress}%` }} />
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                            <CalendarIcon className="w-3.5 h-3.5" /> {formatDateDisplay(becario.start_date)} - {formatDateDisplay(becario.end_date)}
                        </div>
                    </div>
                );
            }
        }
    ];

    return (
        <AppLayout breadcrumbs={[{ title: 'Becarios', href: '/becarios' }]}>
            <Head title="Gestión de Becarios" />

            <div className="p-4 md:p-6">
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <h2 className="text-2xl font-bold text-gray-800">Listado de Becarios</h2>
                    <div className="flex gap-3">
                        <a href={`/becarios/export?${new URLSearchParams(params as any)}`} className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 text-sm font-medium flex items-center gap-2">
                            <FileDown className="w-4 h-4" /> Exportar
                        </a>
                        {isAdmin && (
                            <Link href="/becarios/create" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-2">
                                <Plus className="w-4 h-4" /> Nuevo Becario
                            </Link>
                        )}
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                        <div className="md:col-span-6">
                            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Búsqueda</label>
                            <SearchInput 
                                value={params.search}
                                onChange={(val) => handleFilterChange('search', val)}
                                placeholder="Nombre, DNI, email..."
                            />
                        </div>
                        <div className="md:col-span-3">
                            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Estado</label>
                            <select 
                                name="status" 
                                value={params.status} 
                                onChange={(e) => handleFilterChange('status', e.target.value)} 
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none h-[38px] cursor-pointer"
                            >
                                <option value="">Todos</option>
                                <option value="active">Activo</option>
                                <option value="finished">Finalizado</option>
                                <option value="abandoned">Abandonado</option>
                            </select>
                        </div>
                        <div className="md:col-span-3">
                            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Centro</label>
                            <select 
                                name="center_id" 
                                value={params.center_id} 
                                onChange={(e) => handleFilterChange('center_id', e.target.value)} 
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none h-[38px] cursor-pointer"
                            >
                                <option value="">Todos los centros</option>
                                {centers?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 pt-4 border-t border-gray-100">
                        {/* FILTROS CON CALENDARIO NUEVO */}
                        <FilterDatePicker name="start_from" value={params.start_from} label="Inicio (Desde)" onChange={handleFilterChange} />
                        <FilterDatePicker name="start_to" value={params.start_to} label="Inicio (Hasta)" onChange={handleFilterChange} />
                        <FilterDatePicker name="end_from" value={params.end_from} label="Fin (Desde)" onChange={handleFilterChange} />
                        <FilterDatePicker name="end_to" value={params.end_to} label="Fin (Hasta)" onChange={handleFilterChange} />

                        <div className="flex flex-col">
                            <label className="text-[10px] font-bold uppercase mb-1 block opacity-0 select-none">Espaciador</label>
                            <button 
                                onClick={resetFilters} 
                                className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-sm text-gray-500 hover:text-red-600 border border-dashed border-gray-300 rounded-lg hover:border-red-200 transition-colors cursor-pointer h-[38px]"
                            >
                                <X className="w-4 h-4" /> 
                                <span>Limpiar</span>
                            </button>
                        </div>
                    </div>
                </div>

                <DataTable 
                    columns={columns}
                    data={interns.data}
                    pagination={interns}
                    params={params}
                    emptyMessage={
                        <div className="flex flex-col items-center gap-2 py-6">
                            <AlertCircle className="w-6 h-6 text-gray-300" />
                            <span>No se encontraron becarios con estos filtros.</span>
                        </div>
                    }
                    actions={(becario) => (
                        <div className="flex justify-end gap-1.5">
                            <Link href={`/becarios/${becario.id}`} className="p-2 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg transition-all" title="Ver">
                                <User className="w-4 h-4" /> 
                            </Link>
                            {isAdmin && (
                                <>
                                    <Link href={`/becarios/${becario.id}/edit`} className="p-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg">
                                        <Edit2 className="w-4 h-4" />
                                    </Link>
                                    <button onClick={() => {
                                        setInternToDelete(becario);
                                        setIsDeleting(true);
                                    }} className="p-2 bg-red-600 text-white hover:bg-red-700 rounded-lg cursor-pointer">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                />
            </div>           

            <DeleteConfirmModal 
                isOpen={isDeleting}
                onClose={() => setIsDeleting(false)}
                onConfirm={() => {
                    if (internToDelete) {
                        router.delete(`/becarios/${internToDelete.id}`, {
                            onSuccess: () => setIsDeleting(false),
                        });
                    }
                }}
                title="¿Eliminar becario?"
                itemName={`${internToDelete?.name} ${internToDelete?.last_name}`}
            />
        </AppLayout>
    );
}
