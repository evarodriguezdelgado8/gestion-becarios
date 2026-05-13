import { router } from '@inertiajs/react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import type { Pagination as PaginationType } from "@/types";

export interface Column<T> {
    header: string;
    render: (item: T) => React.ReactNode;
    className?: string;
}

interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    emptyMessage?: React.ReactNode;
    actions?: (item: T) => React.ReactNode; 
    pagination?: PaginationType<T>;
    params?: any;
}

export default function DataTable<T>({ 
    columns, 
    data, 
    emptyMessage = "No se encontraron resultados.",
    actions,
    pagination,
    params = {}
}: DataTableProps<T>) {
    
    const handlePageChange = (url: string | null) => {
        if (url) {
            router.get(url, params, { 
                preserveState: true, 
                preserveScroll: true,
                replace: true 
            });
        }
    };

    return (
        <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xl">
            <div className="overflow-x-auto">
                <Table className="min-w-[900px]">
                    <TableHeader className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-black uppercase tracking-widest text-slate-400">
                        <TableRow className="border-slate-100 hover:bg-transparent">
                            {columns.map((col, i) => (
                                <TableHead key={i} className={`px-6 py-4 font-black text-slate-400 ${col.className ?? ''}`}>
                                    {col.header}
                                </TableHead>
                            ))}
                            {actions && <TableHead className="w-[128px] px-6 py-4 text-right font-black text-slate-400">Acciones</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-slate-100">
                        {data.length > 0 ? (
                            data.map((item, rowIndex) => (
                                <TableRow key={rowIndex} className="border-slate-100 transition-colors hover:bg-slate-50/80">
                                    {columns.map((col, colIndex) => (
                                        <TableCell key={colIndex} className="whitespace-normal px-6 py-5 align-top">
                                            {col.render(item)}
                                        </TableCell>
                                    ))}
                                    {actions && (
                                        <TableCell className="whitespace-normal px-6 py-5 text-right align-top">
                                            {actions(item)}
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell 
                                    colSpan={actions ? columns.length + 1 : columns.length} 
                                    className="px-6 py-14 text-center text-slate-400"
                                >
                                    {emptyMessage}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            
            {pagination && (
                <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-100 bg-slate-50/70 px-6 py-4 md:flex-row">
                    <p className="rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-slate-500 shadow-sm ring-1 ring-slate-100">
                        Mostrando <span className="font-black text-slate-900">{data.length}</span> de <span className="font-black text-slate-900">{pagination.total}</span> resultados
                    </p>
                    
                    {pagination.total > data.length && (
                        <div className="inline-flex overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <button 
                                disabled={!pagination.prev_page_url}
                                onClick={() => handlePageChange(pagination.prev_page_url)}
                                className="cursor-pointer border-r border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Anterior
                            </button>
                            <button 
                                disabled={!pagination.next_page_url}
                                onClick={() => handlePageChange(pagination.next_page_url)}
                                className="cursor-pointer px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Siguiente
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
