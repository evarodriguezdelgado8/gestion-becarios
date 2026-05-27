import { Edit3 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

import DateTimePickerField from './DateTimePickerField';

export default function ManualRegistryForm({ manualForm, eligibleBecarios, eligibleBecarioUserIds, handleManualSubmit }: any) {
    return (
        <Card className="overflow-hidden rounded-3xl border-none bg-white shadow-xl">
            <div className="border-b border-slate-100 bg-gradient-to-r from-sky-50 via-white to-emerald-50 p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-600 text-white shadow-lg shadow-sky-100">
                            <Edit3 className="h-6 w-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900">Añadir registro manual</h2>
                            <p className="text-sm text-slate-500">Completa una jornada para los becarios filtrados</p>
                        </div>
                    </div>
                    <span className="w-fit rounded-full border border-sky-100 bg-white px-4 py-2 text-xs font-black uppercase tracking-wide text-sky-700 shadow-sm">{eligibleBecarios.length} becarios afectados</span>
                </div>
            </div>
            <form onSubmit={handleManualSubmit} className="space-y-6 p-6">
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                        <DateTimePickerField label="Entrada" value={manualForm.data.check_in} onChange={(value) => manualForm.setData('check_in', value)} />
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                        <DateTimePickerField label="Salida" value={manualForm.data.check_out} onChange={(value) => manualForm.setData('check_out', value)} />
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_180px_260px]">
                    <div className="space-y-2">
                        <label className="ml-1 text-xs font-bold uppercase tracking-wide text-slate-500">Observación</label>
                        <textarea
                            value={manualForm.data.note}
                            className="min-h-[122px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                            placeholder="Ej: Olvido de fichaje, salida registrada por tutor..."
                            onChange={(e) => manualForm.setData('note', e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="ml-1 text-xs font-bold uppercase tracking-wide text-slate-500">Estado</label>
                        <select value={manualForm.data.status} onChange={(e) => manualForm.setData('status', e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100">
                            <option value="normal">Puntual</option>
                            <option value="late">Retraso</option>
                        </select>
                    </div>                    
                </div>

                <div className="flex justify-end">
                    <Button disabled={manualForm.processing || eligibleBecarioUserIds.length === 0} className="h-12 rounded-2xl bg-sky-600 px-8 font-bold text-white shadow-lg shadow-sky-100 hover:bg-sky-700">
                        {manualForm.processing ? 'Guardando...' : 'Registrar jornada'}
                    </Button>
                </div>
            </form>
        </Card>
    );
}
