import { Edit3, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function RegistriesTable({ managerRegistries, getRegistryHoursLabel, openEditRegistry, setDeletingRegistry }: any) {
    return (
        <Card className="overflow-hidden rounded-3xl border-none bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                <div>
                    <h3 className="text-lg font-bold text-slate-900">Fichajes registrados</h3>
                    <p className="text-sm text-slate-500">Edita o elimina cualquier fichaje de los becarios filtrados.</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{managerRegistries.length} registros</span>
            </div>

            {managerRegistries.length === 0 ? (
                <div className="px-6 py-12 text-center text-slate-400">No hay fichajes para los filtros actuales.</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50/80 text-left">
                            <tr>
                                <th className="px-6 py-3 font-bold uppercase tracking-wider text-slate-400">Becario</th>
                                <th className="px-6 py-3 font-bold uppercase tracking-wider text-slate-400">Entrada</th>
                                <th className="px-6 py-3 font-bold uppercase tracking-wider text-slate-400">Salida</th>
                                <th className="px-6 py-3 font-bold uppercase tracking-wider text-slate-400">Horas</th>
                                <th className="px-6 py-3 font-bold uppercase tracking-wider text-slate-400">Tipo</th>
                                <th className="px-6 py-3 font-bold uppercase tracking-wider text-slate-400">Estado</th>
                                <th className="px-6 py-3 font-bold uppercase tracking-wider text-slate-400">Observación</th>
                                <th className="px-6 py-3 text-right font-bold uppercase tracking-wider text-slate-400">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {managerRegistries.map((registry: any) => (
                                <tr key={registry.id} className="hover:bg-slate-50/60">
                                    <td className="px-6 py-4">
                                        <div className="font-semibold text-slate-800">{registry.intern_name || 'Sin asignar'}</div>
                                        <div className="text-xs text-slate-400">{registry.center_name || 'Sin centro'}</div>
                                    </td>
                                    <td className="px-6 py-4 font-mono text-slate-700">
                                        {new Date(registry.check_in).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                    <td className="px-6 py-4 font-mono text-slate-700">
                                        {registry.check_out ? new Date(registry.check_out).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Activa'}
                                    </td>
                                    <td className="px-6 py-4 font-semibold text-slate-700">{getRegistryHoursLabel(registry)}</td>
                                    <td className="px-6 py-4">
                                        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${registry.type === 'manual' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                                            {registry.type === 'manual' ? 'Manual' : 'Automático'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${registry.status === 'late' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
                                            {registry.status === 'late' ? 'Retraso' : 'Puntual'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500">{registry.note || 'Sin observaciones'}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-end gap-2">
                                            <Button type="button" variant="outline" size="icon" className="h-8 w-8 rounded-xl" onClick={() => openEditRegistry(registry)} title="Editar fichaje" aria-label="Editar fichaje">
                                                <Edit3 className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button type="button" variant="destructive" size="icon" className="h-8 w-8 rounded-xl" onClick={() => setDeletingRegistry(registry)} title="Eliminar fichaje" aria-label="Eliminar fichaje">
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </Card>
    );
}
