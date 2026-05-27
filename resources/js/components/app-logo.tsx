import AppLogoIcon from '@/components/app-logo-icon';

export default function AppLogo() {
    return (
        <>
            <div className="flex aspect-square size-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-sidebar-border transition group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:size-8">
                <AppLogoIcon className="size-8 shrink-0 group-data-[collapsible=icon]:size-7" />
            </div>
            <div className="ml-1 grid min-w-0 flex-1 text-left text-sm group-data-[collapsible=icon]:hidden">
                <span className="mb-0.5 truncate leading-tight font-black text-slate-900 dark:text-white">
                    EduTrack
                </span>
                <span className="truncate text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Practicas y seguimiento
                </span>
            </div>
        </>
    );
}
