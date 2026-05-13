import { useMemo } from 'react';

import { Tabs, TabsContent } from '@/components/ui/tabs';

import InternAbsencesPanel from './components/intern/InternAbsencesPanel';
import InternCalendar from './components/intern/InternCalendar';
import InternHistoryTable from './components/intern/InternHistoryTable';
import InternHoursChart from './components/intern/InternHoursChart';
import InternPdfCard from './components/intern/InternPdfCard';
import InternSummaryCards from './components/intern/InternSummaryCards';
import InternTabsNav from './components/intern/InternTabsNav';
import { getRegistryWorkedHours  } from './components/intern/internUtils';
import type {Period} from './components/intern/internUtils';
import TodayScheduleCard from './components/intern/TodayScheduleCard';

interface Props {
    activeSession: any;
    registries: any[];
    schedules: any[];
    absences: any[];
    intern?: any;
    generalProcessing: boolean;
    handleCheckIn: () => void;
    handleCheckOut: () => void;
    elapsedTime: string;
    pdfPeriod: Period;
    setPdfPeriod: (period: Period) => void;
    pdfDate: string;
    setPdfDate: (date: string) => void;
    handlePdfDownload: () => void;
}

export default function InternDashboard({
    activeSession,
    registries,
    schedules,
    absences,
    intern,
    generalProcessing,
    handleCheckIn,
    handleCheckOut,
    elapsedTime,
    pdfPeriod,
    setPdfPeriod,
    pdfDate,
    setPdfDate,
    handlePdfDownload,
}: Props) {
    const targetHours = Math.max(Number(intern?.total_hours || 400), 1);
    const liveNow = useMemo(() => new Date(), []);
    const registriesWithActiveSession = useMemo(() => {
        if (!activeSession || registries.some((registry) => registry.id === activeSession.id)) {
            return registries;
        }

        return [activeSession, ...registries];
    }, [activeSession, registries]);
    const workedHours = useMemo(
        () => Number(registriesWithActiveSession.reduce((acc, registry) => acc + getRegistryWorkedHours(registry, liveNow), 0).toFixed(1)),
        [liveNow, registriesWithActiveSession],
    );
    const progress = Math.min((workedHours / targetHours) * 100, 100);

    return (
        <div className="mx-auto w-full max-w-6xl animate-in space-y-8 pb-10 fade-in duration-500">
            <Tabs defaultValue="dashboard" className="w-full">
                <div className="mb-8 flex flex-col items-center justify-between gap-4 md:flex-row">
                    <h2 className="text-2xl font-bold text-gray-900">Control de asistencia</h2>
                </div>

                <InternPdfCard
                    pdfPeriod={pdfPeriod}
                    setPdfPeriod={setPdfPeriod}
                    pdfDate={pdfDate}
                    setPdfDate={setPdfDate}
                    handlePdfDownload={handlePdfDownload}
                />

                <InternTabsNav />

                <TabsContent value="dashboard" className="mt-0 space-y-8 outline-none">
                    <InternSummaryCards
                        activeSession={activeSession}
                        workedHours={workedHours}
                        targetHours={targetHours}
                        progress={progress}
                        elapsedTime={elapsedTime}
                        generalProcessing={generalProcessing}
                        handleCheckIn={handleCheckIn}
                        handleCheckOut={handleCheckOut}
                    />

                    <TodayScheduleCard schedules={schedules} />

                    <InternHoursChart
                        activeSession={activeSession}
                        registries={registriesWithActiveSession}
                        schedules={schedules}
                        liveNow={liveNow}
                    />
                </TabsContent>

                <TabsContent value="calendar" className="mt-0 outline-none">
                    <InternCalendar
                        registries={registries}
                        schedules={schedules}
                        absences={absences}
                        intern={intern}
                        liveNow={liveNow}
                    />
                </TabsContent>

                <TabsContent value="history" className="mt-0 outline-none">
                    <InternHistoryTable registries={registries} />
                </TabsContent>

                <TabsContent value="absences" className="mt-0 outline-none">
                    <InternAbsencesPanel absences={absences} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
