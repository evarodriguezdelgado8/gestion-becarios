import { Download } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function ManagerPdfCard({
    selectedSingleBecario,
    pdfInternId,
    setPdfInternId,
    pdfPeriod,
    setPdfPeriod,
    pdfDate,
    setPdfDate,
    managerPdfInternId,
    becarios,
    handlePdfDownload,
}: any) {
    return (
        <Card className="rounded-3xl border-none bg-white p-5 shadow-xl">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_180px_180px_auto] md:items-end">
                <div>
                    <h3 className="font-bold text-slate-900">Exportar parte de horas</h3>
                    <p className="text-sm text-slate-500">Descarga el parte semanal o mensual del becario seleccionado.</p>
                </div>
                {!selectedSingleBecario?.user_id && (
                    <div className="space-y-1.5">
                        <label className="ml-1 text-[11px] font-bold uppercase text-slate-400">Becario</label>
                        <select value={pdfInternId} onChange={(e) => setPdfInternId(e.target.value)} className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm">
                            <option value="">Seleccionar</option>
                            {becarios
                                .filter((becario: any) => becario.user_id)
                                .map((becario: any) => (
                                    <option key={becario.id} value={becario.id}>
                                        {becario.name} {becario.last_name}
                                    </option>
                                ))}
                        </select>
                    </div>
                )}
                <div className="space-y-1.5">
                    <label className="ml-1 text-[11px] font-bold uppercase text-slate-400">Periodo</label>
                    <select value={pdfPeriod} onChange={(e) => setPdfPeriod(e.target.value as 'weekly' | 'monthly')} className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm">
                        <option value="weekly">Semanal</option>
                        <option value="monthly">Mensual</option>
                    </select>
                </div>
                <div className="space-y-1.5">
                    <label className="ml-1 text-[11px] font-bold uppercase text-slate-400">Fecha base</label>
                    <input type="date" value={pdfDate} onChange={(e) => setPdfDate(e.target.value)} className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm" />
                </div>
                <Button type="button" disabled={!managerPdfInternId} onClick={() => handlePdfDownload(managerPdfInternId)} className="h-10 rounded-xl bg-slate-900 font-bold text-white hover:bg-slate-800">
                    <Download className="mr-2 h-4 w-4" /> Descargar PDF
                </Button>
            </div>
        </Card>
    );
}
