import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Center, BreadcrumbItem, Intern } from '@/types';
import { User, Mail, Calendar, ArrowLeft, BadgeCheck, Clock, MapPin, Phone } from 'lucide-react';


export default function Show({ center, interns, stats }: { 
    center: Center, 
    interns: Intern[], 
    stats: { total: number, activos: number, finalizados: number } 
}) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Centros Educativos', href: '/centros' },
        { title: center.name, href: '#' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Histórico - ${center.name}`} />

            <div className="p-4 md:p-8 max-w-7xl mx-auto">

                <div className="mb-8">
                    <Link 
                        href="/centros" 
                        className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors mb-4 bg-blue-50 px-3 py-1.5 rounded-lg"
                    >
                        <ArrowLeft className="w-4 h-4" /> Volver al listado
                    </Link>
                    
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div>
                            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">{center.name}</h2>
                            <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500 font-medium">
                                <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-red-400" /> {center.address}</span>
                                <span className="flex items-center gap-1.5"><Phone className="w-4 h-4 text-gray-400" /> {center.phone}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-5">
                        <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-600"><User className="w-6 h-6" /></div>
                        <div>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Total Histórico</p>
                            <p className="text-2xl font-black text-gray-900">{stats.total}</p>
                        </div>
                    </div>
                    
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-5">
                        <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-600"><BadgeCheck className="w-6 h-6" /></div>
                        <div>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Activos Ahora</p>
                            <p className="text-2xl font-black text-emerald-600">{stats.activos}</p>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-5">
                        <div className="p-4 bg-amber-50 rounded-2xl text-amber-600"><Clock className="w-6 h-6" /></div>
                        <div>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Finalizados</p>
                            <p className="text-2xl font-black text-gray-900">{stats.finalizados}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-200 overflow-hidden">
                    <div className="px-8 py-5 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-blue-500" /> Becarios Vinculados
                        </h3>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50/80 text-[11px] uppercase font-bold text-gray-500 tracking-widest border-b">
                                <tr>
                                    <th className="px-8 py-4">Nombre Completo</th>
                                    <th className="px-8 py-4">Email</th>
                                    <th className="px-8 py-4">Fecha Inicio</th>
                                    <th className="px-8 py-4 text-center">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {interns.length > 0 ? interns.map(intern => (
                                    <tr key={intern.id} className="hover:bg-blue-50/30 transition-colors group">
                                        <td className="px-8 py-4">
                                            <div className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                                                {intern.name} {intern.last_name}
                                            </div>
                                        </td>
                                        <td className="px-8 py-4 text-gray-500 italic">{intern.email}</td>
                                        <td className="px-8 py-4">
                                            <div className="flex items-center gap-2 text-gray-600 font-medium">
                                                <Calendar className="w-4 h-4 text-gray-400" /> {intern.start_date}
                                            </div>
                                        </td>
                                        <td className="px-8 py-4 text-center">
                                            {intern.status === 'active' ? (
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200">

                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
                                                    Activo
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-gray-100 text-gray-600 ring-1 ring-gray-200">

                                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mr-2"></span>
                                                    Finalizado
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={4} className="px-8 py-16 text-center">
                                            <div className="flex flex-col items-center gap-2 text-gray-400">
                                                <User className="w-10 h-10 opacity-20" />
                                                <p className="font-medium italic text-lg">No hay registros de becarios para este centro.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}