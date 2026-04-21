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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader className="bg-gray-50 border-b text-[11px] uppercase tracking-wider font-bold text-gray-500">
                        <TableRow>
                            {columns.map((col, i) => (
                                <TableHead key={i} className={col.className}>
                                    {col.header}
                                </TableHead>
                            ))}
                            {actions && <TableHead className="text-right w-[100px]"></TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-gray-100">
                        {data.length > 0 ? (
                            data.map((item, rowIndex) => (
                                <TableRow key={rowIndex} className="hover:bg-blue-50/10 transition-colors">
                                    {columns.map((col, colIndex) => (
                                        <TableCell key={colIndex} className="px-4 py-4 align-middle">
                                            {col.render(item)}
                                        </TableCell>
                                    ))}
                                    {actions && (
                                        <TableCell className="px-4 py-4 text-right align-middle">
                                            {actions(item)}
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell 
                                    colSpan={actions ? columns.length + 1 : columns.length} 
                                    className="px-6 py-12 text-center text-gray-400 italic"
                                >
                                    {emptyMessage}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            
            {pagination && (
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-sm text-gray-500">
                        Mostrando <span className="font-semibold text-gray-800">{data.length}</span> de <span className="font-semibold text-gray-800">{pagination.total}</span> resultados
                    </p>
                    
                    {pagination.total > data.length && (
                        <div className="inline-flex shadow-sm rounded-lg overflow-hidden border border-gray-300">
                            <button 
                                disabled={!pagination.prev_page_url}
                                onClick={() => handlePageChange(pagination.prev_page_url)}
                                className="px-4 py-2 bg-white hover:bg-gray-50 disabled:opacity-50 transition border-r font-medium text-gray-700 cursor-pointer disabled:cursor-not-allowed text-sm"
                            >
                                Anterior
                            </button>
                            <button 
                                disabled={!pagination.next_page_url}
                                onClick={() => handlePageChange(pagination.next_page_url)}
                                className="px-4 py-2 bg-white hover:bg-gray-50 disabled:opacity-50 transition font-medium text-gray-700 cursor-pointer disabled:cursor-not-allowed text-sm"
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