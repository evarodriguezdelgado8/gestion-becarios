import { CheckCircle2, Play, Square } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

import { formatDurationFromHours } from './internUtils';

interface InternSummaryCardsProps {
    activeSession: any;
    workedHours: number;
    targetHours: number;
    progress: number;
    elapsedTime: string;
    generalProcessing: boolean;
    handleCheckIn: () => void;
    handleCheckOut: () => void;
}

export default function InternSummaryCards({
    activeSession,
    workedHours,
    targetHours,
    progress,
    elapsedTime,
    generalProcessing,
    handleCheckIn,
    handleCheckOut,
}: InternSummaryCardsProps) {
    return (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <Card className="flex flex-col justify-center rounded-[32px] border-none bg-white p-8 shadow-xl md:col-span-2">
                <div className="mb-4 flex items-end justify-between">
                    <div>
                        <p className="mb-1 text-[11px] font-bold uppercase tracking-widest text-slate-400">Horas Acumuladas</p>
                        <h2 className="text-4xl font-black text-slate-900">
                            {formatDurationFromHours(workedHours)} <span className="text-xl font-medium text-slate-300">/ {targetHours}h</span>
                        </h2>
                    </div>
                    <div className="text-right">
                        <span className="text-2xl font-black text-blue-600">{progress.toFixed(0)}%</span>
                    </div>
                </div>
                <Progress value={progress} className="h-3 bg-slate-100" />
                <p className="mt-4 flex items-center gap-2 text-xs text-slate-400">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    Has completado {progress.toFixed(0)}% de tus prácticas.
                </p>
            </Card>

            <Card className={`rounded-[32px] border-none p-8 shadow-2xl transition-all ${activeSession ? 'bg-slate-900 text-white' : 'bg-white'}`}>
                <p className={`mb-2 text-[11px] font-bold uppercase tracking-widest ${activeSession ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {activeSession ? 'En Curso' : 'Turno Cerrado'}
                </p>
                <div className="mb-8 font-mono text-4xl font-bold">{activeSession ? elapsedTime : '00:00:00'}</div>

                {!activeSession ? (
                    <Button onClick={handleCheckIn} disabled={generalProcessing} className="h-14 w-full rounded-2xl bg-emerald-600 font-bold text-white shadow-lg hover:bg-emerald-700">
                        <Play className="mr-2 h-5 w-5 fill-current" /> Iniciar Ahora
                    </Button>
                ) : (
                    <Button onClick={handleCheckOut} disabled={generalProcessing} variant="destructive" className="h-14 w-full rounded-2xl font-bold shadow-lg">
                        <Square className="mr-2 h-5 w-5 fill-current" /> Terminar
                    </Button>
                )}
            </Card>
        </div>
    );
}
