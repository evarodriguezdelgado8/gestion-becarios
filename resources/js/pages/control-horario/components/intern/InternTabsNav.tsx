import { Calendar as CalendarIcon, FileText, History, LayoutDashboard } from 'lucide-react';

import { TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function InternTabsNav() {
    return (
        <div className="mb-8 flex flex-col items-center justify-between gap-4 md:flex-row">
            <TabsList className="h-12 rounded-2xl bg-slate-100 p-1">
                <TabsTrigger value="dashboard" className="rounded-xl px-6 font-bold shadow-none data-[state=active]:bg-white">
                    <LayoutDashboard className="mr-2 h-4 w-4" /> Resumen
                </TabsTrigger>
                <TabsTrigger value="calendar" className="rounded-xl px-6 font-bold shadow-none data-[state=active]:bg-white">
                    <CalendarIcon className="mr-2 h-4 w-4" /> Mi Horario
                </TabsTrigger>
                <TabsTrigger value="history" className="rounded-xl px-6 font-bold shadow-none data-[state=active]:bg-white">
                    <History className="mr-2 h-4 w-4" /> Historial
                </TabsTrigger>
                <TabsTrigger value="absences" className="rounded-xl px-6 font-bold shadow-none data-[state=active]:bg-white">
                    <FileText className="mr-2 h-4 w-4" /> Ausencias
                </TabsTrigger>
            </TabsList>
        </div>
    );
}
