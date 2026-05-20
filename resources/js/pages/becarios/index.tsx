import { Head, router, Link, usePage } from '@inertiajs/react';
import { format } from "date-fns";
import { debounce } from 'lodash';
import { 
    User, Mail, Building2, GraduationCap, 
    Edit2, Trash2, Plus,
    Copy, Check, Calendar as CalendarIcon, AlertCircle,
    Phone, FileDown, ChevronDown, SlidersHorizontal
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';

import ClearFiltersButton from '@/components/common/ClearFiltersButton';
import type { Column } from '@/components/common/DataTable';
import DataTable from '@/components/common/DataTable';
import DeleteConfirmModal from '@/components/common/DeleteConfirmModal';
import SearchInput from '@/components/common/SearchInput';

// Importamos tus componentes de UI
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar"; 
import { MultiSelect } from '@/components/ui/multi-select';
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
    'active': { label: 'Activo', class: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
    'finished': { label: 'Finalizado', class: 'bg-blue-50 text-blue-700 border-blue-100' },
    'abandoned': { label: 'Abandonado', class: 'bg-rose-50 text-rose-700 border-rose-100' },
};

const statusOptions = [
    { label: 'Activo', value: 'active' },
    { label: 'Finalizado', value: 'finished' },
    { label: 'Abandonado', value: 'abandoned' },
];

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
        <label className="mb-1 block text-[10px] font-black uppercase text-slate-400">{label}</label>
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    className={cn(
                        "h-[38px] w-full justify-start rounded-xl border-slate-200 text-left text-sm font-normal",
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
    const [filtersOpen, setFiltersOpen] = useState(false);

    const [params, setParams] = useState({
        search: filters.search || '',
        status: filters.status || '',
        center_id: filters.center_id || '',
        start_from: filters.start_from || '',
        start_to: filters.start_to || '',
        end_from: filters.end_from || '',
        end_to: filters.end_to || '',
    });
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>(filters.status ? filters.status.split(',').filter(Boolean) : []);
    const [selectedCenters, setSelectedCenters] = useState<string[]>(filters.center_id ? filters.center_id.split(',').filter(Boolean) : []);
    const activeFiltersCount = Object.values(params).filter(Boolean).length;

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

    const handleStatusChange = (values: string[]) => {
        setSelectedStatuses(values);
        handleFilterChange('status', values.join(','));
    };

    const handleCenterChange = (values: string[]) => {
        setSelectedCenters(values);
        handleFilterChange('center_id', values.join(','));
    };

    const resetFilters = () => {
        const empty = { 
            search: '', status: '', center_id: '', 
            start_from: '', start_to: '', 
            end_from: '', end_to: '' 
        };
        setParams(empty);
        setSelectedStatuses([]);
        setSelectedCenters([]);
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
                <div className="flex items-start gap-3">
                    <div className="mt-1 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-blue-50 font-bold text-blue-600 ring-1 ring-blue-100">
                        <User className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                        <Link href={`/becarios/${becario.id}`} className="text-base font-bold leading-tight text-slate-900 transition-colors hover:text-blue-600">
                            {becario.name} {becario.last_name}
                        </Link>
                        <div className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 font-mono text-[11px] font-bold text-slate-500">
                            DNI: {becario.dni}
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-slate-600">
                            <Phone className="h-3.5 w-3.5 text-slate-400" /> {becario.phone || 'N/A'}
                        </div>
                        <div className="flex items-center gap-1">
                            <Mail className="h-3.5 w-3.5 text-slate-400" />
                            <span className="max-w-[160px] truncate text-sm font-medium text-slate-600">{becario.email}</span>
                            <button onClick={() => {
                                navigator.clipboard.writeText(becario.email);
                                setCopiedEmail(becario.id);
                                toast.info('Copiado al portapapeles');
                                setTimeout(() => setCopiedEmail(null), 2000);
                            }} className="cursor-pointer rounded-xl bg-slate-100 p-1 text-slate-400 hover:text-blue-600">
                                {copiedEmail === becario.id ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
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
                <div className="space-y-2">
                    <div className="flex items-start gap-1.5 text-base font-bold leading-tight text-slate-900">
                        <Building2 className="mt-1 h-4 w-4 flex-shrink-0 text-slate-400" />
                        {becario.center ? (
                            <Link href={`/centros/${becario.center.id}`} className="break-words transition-colors hover:text-blue-600">
                                {becario.center.name}
                            </Link>
                        ) : <span className="text-sm font-normal italic text-slate-400">Sin centro</span>}
                    </div>
                    <div className="ml-6 flex items-center gap-1.5 text-[12px] font-black uppercase text-slate-400">
                        <User className="h-3.5 w-3.5 text-slate-400" /> {becario.tutor?.name || 'Sin tutor asignado'}
                    </div>
                    <div className="ml-6 text-[11px] font-semibold text-slate-400">
                        Centro: {becario.academic_tutor || 'Sin tutor académico'}
                    </div>
                    <div className="ml-6 flex items-center gap-1.5 text-sm font-semibold text-slate-600">
                        <GraduationCap className="h-4 w-4 text-slate-400" /> {becario.academic_cycle || 'N/A'}
                    </div>
                </div>
            )
        },
        {
            header: 'Estado y Progreso',
            className: 'min-w-[200px]',
            render: (becario) => {
                const statusInfo = statusMap[becario.status] || { label: becario.status, class: 'bg-slate-100 text-slate-600 border-slate-200' };
                const progress = Math.round((becario.completed_hours / (becario.total_hours || 400)) * 100);
                return (
                    <div className="space-y-3">
                        <div className="flex items-end justify-between text-[11px]">
                            <span className={`rounded-full border px-2.5 py-1 font-black uppercase ${statusInfo.class}`}>
                                {statusInfo.label}
                            </span>
                            <span className="font-mono font-black text-blue-600">{progress}%</span>
                        </div>
                        <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                            <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${progress}%` }} />
                        </div>
                        <div className="flex items-center gap-1 text-xs font-semibold text-slate-500">
                            <CalendarIcon className="h-3.5 w-3.5" /> {formatDateDisplay(becario.start_date)} - {formatDateDisplay(becario.end_date)}
                        </div>
                    </div>
                );
            }
        }
    ];

    return (
        <AppLayout breadcrumbs={[{ title: 'Becarios', href: '/becarios' }]}>
            <Head title="Gestión de Becarios" />

            <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-8">
                <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
                    <h2 className="text-2xl font-bold text-gray-800">Listado de Becarios</h2>
                    <div className="flex gap-3">
                        <a href={`/becarios/export?${new URLSearchParams(params as any)}`} className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700">
                            <FileDown className="w-4 h-4" /> Exportar
                        </a>
                        {isAdmin && (
                            <Link href="/becarios/create" className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700">
                                <Plus className="w-4 h-4" /> Nuevo Becario
                            </Link>
                        )}
                    </div>
                </div>

                <div className="rounded-3xl border border-slate-200/80 bg-white shadow-xl">
                    <div className="flex flex-col justify-between gap-3 px-5 py-4 md:flex-row md:items-center">
                        <button type="button" onClick={() => setFiltersOpen((current) => !current)} className="flex items-center gap-3 text-left">
                            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                                <SlidersHorizontal className="h-5 w-5" />
                            </span>
                            <span>
                                <span className="block text-sm font-black text-slate-900">Filtros</span>
                                <span className="block text-xs font-semibold text-slate-400">
                                    {activeFiltersCount > 0 ? `${activeFiltersCount} filtro(s) activo(s)` : 'Pulsa para filtrar el listado'}
                                </span>
                            </span>
                        </button>

                        <div className="flex items-center justify-end gap-2">
                            {activeFiltersCount > 0 && <ClearFiltersButton onClick={resetFilters} />}
                            <button type="button" onClick={() => setFiltersOpen((current) => !current)} className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50">
                                <ChevronDown className={`h-4 w-4 transition-transform ${filtersOpen ? 'rotate-180' : ''}`} />
                            </button>
                        </div>
                    </div>

                    {filtersOpen && (
                        <div className="space-y-4 border-t border-slate-100 px-5 pb-5 pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                        <div className="md:col-span-6">
                            <label className="mb-1 block text-[10px] font-black uppercase text-slate-400">Búsqueda</label>
                            <SearchInput 
                                value={params.search}
                                onChange={(val) => handleFilterChange('search', val)}
                                placeholder="Nombre, DNI, email..."
                            />
                        </div>
                        <div className="md:col-span-3">
                            <label className="mb-1 block text-[10px] font-black uppercase text-slate-400">Estado</label>
                            <MultiSelect
                                options={statusOptions}
                                selected={selectedStatuses}
                                onChange={handleStatusChange}
                                placeholder="Todos los estados"
                            />
                        </div>
                        <div className="md:col-span-3">
                            <label className="mb-1 block text-[10px] font-black uppercase text-slate-400">Centro</label>
                            <MultiSelect
                                options={centers?.map((center) => ({ label: center.name, value: center.id.toString() })) ?? []}
                                selected={selectedCenters}
                                onChange={handleCenterChange}
                                placeholder="Todos los centros"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2 lg:grid-cols-5">
                        {/* FILTROS CON CALENDARIO NUEVO */}
                        <FilterDatePicker name="start_from" value={params.start_from} label="Inicio (Desde)" onChange={handleFilterChange} />
                        <FilterDatePicker name="start_to" value={params.start_to} label="Inicio (Hasta)" onChange={handleFilterChange} />
                        <FilterDatePicker name="end_from" value={params.end_from} label="Fin (Desde)" onChange={handleFilterChange} />
                        <FilterDatePicker name="end_to" value={params.end_to} label="Fin (Hasta)" onChange={handleFilterChange} />

                        <div className="flex flex-col">
                            <label className="text-[10px] font-bold uppercase mb-1 block opacity-0 select-none">Espaciador</label>
                            <ClearFiltersButton onClick={resetFilters} className="h-[38px] w-full" />
                        </div>
                    </div>
                        </div>
                    )}
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
                            <Link href={`/becarios/${becario.id}`} className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-900" title="Ver">
                                <User className="w-4 h-4" /> 
                            </Link>
                            {isAdmin && (
                                <>
                                    <Link href={`/becarios/${becario.id}/edit`} className="rounded-xl bg-blue-600 p-2 text-white shadow-sm transition-all hover:bg-blue-700">
                                        <Edit2 className="w-4 h-4" />
                                    </Link>
                                    <button onClick={() => {
                                        setInternToDelete(becario);
                                        setIsDeleting(true);
                                    }} className="cursor-pointer rounded-xl bg-red-600 p-2 text-white shadow-sm transition-all hover:bg-red-700">
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
