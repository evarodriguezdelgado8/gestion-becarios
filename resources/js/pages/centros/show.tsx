import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Center, BreadcrumbItem, Intern } from '@/types';
import { User, Mail, Calendar, ArrowLeft, BadgeCheck, Clock, MapPin, Phone, XCircle, CalendarCheck, Globe } from 'lucide-react';

export default function Show({ center, interns, stats }: { 
    center: Center, 
    interns: Intern[], 
    stats: { total: number, activos: number, finalizados: number, abandonados: number } 
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
                    
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                        <div className="flex-1">
                            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-4">{center.name}</h2>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-3 gap-x-6 text-sm font-medium">
                                
                                <a 
                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(center.address)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors"
                                >
                                    <MapPin className="w-4 h-4 text-gray-400" /> 
                                    {center.address}
                                </a>

                                <span className="flex items-center gap-2 text-gray-500">
                                    <Phone className="w-4 h-4 text-gray-400" /> 
                                    {center.phone}
                                </span>

                                <a href={`mailto:${center.email}`} className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors">
                                    <Mail className="w-4 h-4 text-gray-400" /> 
                                    {center.email}
                                </a>

                                <span className="flex items-center text-gray-500">
                                    <span className="text-gray-400 font-bold mr-2 text-[12px] uppercase">NIF:</span> 
                                    {center.nif}
                                </span>

                                {center.web && (
                                    <a 
                                        href={center.web.startsWith('http') ? center.web : `https://${center.web}`} 
                                        target="_blank" 
                                        className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors"
                                    >
                                        <Globe className="w-4 h-4 text-gray-400" /> 
                                        {center.web.replace(/(^\w+:|^)\/\//, '')}
                                    </a>
                                )}
                            </div>
                        </div>

                        <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 min-w-[280px]">
                            <h4 className="text-[10px] uppercase font-bold text-blue-600 tracking-widest mb-3 flex items-center gap-2">
                                <User className="w-3 h-3" /> Coordinador
                            </h4>
                            <div className="space-y-2">
                                <p className="text-gray-900 font-bold text-sm">{center.contact_name}</p>
                                <p className="text-blue-700/70 text-xs font-semibold">{center.contact_role}</p>
                                <div className="pt-2 flex flex-col gap-1.5 border-t border-blue-100">
                                    <span className="text-xs text-gray-600 flex items-center gap-2">
                                        <Phone className="w-3 h-3 text-blue-400" /> {center.contact_phone}
                                    </span>
                                    <span className="text-xs text-gray-600 flex items-center gap-2">
                                        <Mail className="w-3 h-3 text-blue-400" /> {center.contact_email}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-5">
                        <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-600"><User className="w-6 h-6" /></div>
                        <div>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Total</p>
                            <p className="text-2xl font-black text-gray-900">{stats.total}</p>
                        </div>
                    </div>
                    
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-5">
                        <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-600"><BadgeCheck className="w-6 h-6" /></div>
                        <div>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Activos</p>
                            <p className="text-2xl font-black text-emerald-600">{stats.activos}</p>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-5">
                        <div className="p-4 bg-blue-50 rounded-2xl text-blue-600"><Clock className="w-6 h-6" /></div>
                        <div>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Finalizados</p>
                            <p className="text-2xl font-black text-blue-600">{stats.finalizados}</p>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-5">
                        <div className="p-4 bg-red-50 rounded-2xl text-red-600"><XCircle className="w-6 h-6" /></div>
                        <div>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Abandonados</p>
                            <p className="text-2xl font-black text-red-600">{stats.abandonados || 0}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-200 overflow-hidden">
                    <div className="px-8 py-5 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-900" /> Becarios Vinculados
                        </h3>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50/80 text-[11px] uppercase font-bold text-gray-500 tracking-widest border-b">
                                <tr>
                                    <th className="px-8 py-4">Nombre Completo</th>
                                    <th className="px-8 py-4 text-center">Fecha Inicio</th>
                                    <th className="px-8 py-4 text-center">Fecha Fin</th>
                                    <th className="px-8 py-4 text-center">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {interns.length > 0 ? interns.map(intern => (
                                    <tr key={intern.id} className="hover:bg-blue-50/30 transition-colors group">
                                        <td className="px-8 py-4">
                                            <Link 
                                                href={`/becarios/${intern.id}`}
                                                className="font-bold text-gray-900 hover:text-blue-600 transition-colors block"
                                            >
                                                {intern.name} {intern.last_name}
                                            </Link>
                                            <p className="text-[12px] text-gray-400 italic mt-0.5">{intern.email}</p>
                                        </td>
                                        <td className="px-8 py-4 text-center">
                                            <div className="inline-flex items-center gap-2 text-gray-600 font-medium">
                                                <Calendar className="w-3.5 h-3.5 text-gray-400" /> {intern.start_date}
                                            </div>
                                        </td>
                                        <td className="px-8 py-4 text-center">
                                            <div className="inline-flex items-center gap-2 text-gray-600 font-medium">
                                                <CalendarCheck className="w-3.5 h-3.5 text-gray-400" /> 
                                                {intern.end_date ? (
                                                    <span className="text-gray-600 font-medium">{intern.end_date}</span>
                                                ) : (
                                                    intern.status === 'active' ? (
                                                        <span className="text-gray-300 font-normal italic">En curso</span>
                                                    ) : (
                                                        <span className="text-gray-300">-</span>
                                                    )
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-8 py-4 text-center">
                                            {intern.status === 'active' && (
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200">
                                                    Activo
                                                </span>
                                            )}
                                            {intern.status === 'finished' && (
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-700 ring-1 ring-blue-200">
                                                    Finalizado
                                                </span>
                                            )}
                                            {intern.status === 'abandoned' && (
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-100 text-red-700 ring-1 ring-red-200">
                                                    Abandonado
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={4} className="px-8 py-16 text-center text-gray-400">
                                            No hay registros de becarios para este centro.
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