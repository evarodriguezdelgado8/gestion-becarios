import { Link } from '@inertiajs/react';

import { Card } from '@/components/ui/card';

export default function AttendanceCards({ becarios, getDayStatus }: any) {
    return (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {becarios.map((becario: any) => {
                const dayStatus = getDayStatus(becario);

                return (
                    <Link key={becario.id} href={`/becarios/${becario.id}`} className="block rounded-3xl focus:outline-none focus:ring-2 focus:ring-blue-200">
                        <Card className="h-full cursor-pointer rounded-3xl border-none bg-white p-5 shadow-sm transition-all group hover:-translate-y-0.5 hover:shadow-lg">
                            <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 font-bold capitalize text-slate-500 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                                    {becario.name.charAt(0)}
                                </div>
                                <div>
                                    <h4 className="font-bold leading-tight text-slate-900 transition-colors group-hover:text-blue-700">
                                        {becario.name} {becario.last_name}
                                    </h4>
                                    <p className="mt-1 text-xs text-slate-400">{becario.center?.name || 'Sin centro'}</p>
                                </div>
                            </div>
                            <div className="mt-4 flex items-center justify-between border-t border-slate-50 pt-4">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Hoy</span>
                                <span className={`rounded-lg border px-2 py-1 text-[10px] font-black ${dayStatus.badgeClass}`}>{dayStatus.label}</span>
                            </div>
                            <p className="mt-3 text-sm font-medium text-slate-500">{dayStatus.detail}</p>
                        </Card>
                    </Link>
                );
            })}
        </div>
    );
}
