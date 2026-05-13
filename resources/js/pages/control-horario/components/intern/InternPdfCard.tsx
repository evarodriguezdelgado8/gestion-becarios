import { Download } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

import type {Period} from './internUtils';

interface InternPdfCardProps {
    pdfPeriod: Period;
    setPdfPeriod: (period: Period) => void;
    pdfDate: string;
    setPdfDate: (date: string) => void;
    handlePdfDownload: () => void;
}

export default function InternPdfCard({ pdfPeriod, setPdfPeriod, pdfDate, setPdfDate, handlePdfDownload }: InternPdfCardProps) {
    return (
        <Card className="mb-8 rounded-3xl border-none bg-white p-5 shadow-xl">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_180px_180px_auto] md:items-end">
                <div>
                    <h3 className="font-bold text-slate-900">Parte de horas</h3>
                    <p className="text-sm text-slate-500">Descarga tu parte semanal o mensual para el centro educativo.</p>
                </div>
                <div className="space-y-1.5">
                    <label className="ml-1 text-[11px] font-bold uppercase text-slate-400">Periodo</label>
                    <select
                        value={pdfPeriod}
                        onChange={(event) => setPdfPeriod(event.target.value as Period)}
                        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
                    >
                        <option value="weekly">Semanal</option>
                        <option value="monthly">Mensual</option>
                    </select>
                </div>
                <div className="space-y-1.5">
                    <label className="ml-1 text-[11px] font-bold uppercase text-slate-400">Fecha base</label>
                    <input
                        type="date"
                        value={pdfDate}
                        onChange={(event) => setPdfDate(event.target.value)}
                        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
                    />
                </div>
                <Button type="button" onClick={handlePdfDownload} className="h-10 rounded-xl bg-slate-900 font-bold text-white hover:bg-slate-800">
                    <Download className="mr-2 h-4 w-4" /> Descargar PDF
                </Button>
            </div>
        </Card>
    );
}
