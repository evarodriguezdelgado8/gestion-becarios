import { Link } from '@inertiajs/react';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import type { NavItem } from '@/types';

export function NavMain({ items = [] }: { items: NavItem[] }) {
    const { isCurrentUrl } = useCurrentUrl();

    return (
        <SidebarGroup className="px-2 py-0 group-data-[collapsible=icon]:w-full group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-0">
            <SidebarGroupLabel className="px-3 text-[10px] font-black tracking-[0.18em] text-slate-400 uppercase">
                Menu principal
            </SidebarGroupLabel>
            <SidebarMenu className="gap-1.5 group-data-[collapsible=icon]:items-center">
                {items.map((item, index) => (
                    <SidebarMenuItem
                        key={`${item.href}-${item.title}-${index}`}
                        className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:w-full group-data-[collapsible=icon]:justify-center"
                    >
                        <SidebarMenuButton
                            asChild
                            isActive={isCurrentUrl(item.href)}
                            tooltip={{ children: item.title }}
                            className="h-10 rounded-xl px-3 font-semibold text-slate-600 transition-all group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:px-0 hover:bg-white/80 hover:text-slate-950 hover:shadow-sm data-[active=true]:bg-white data-[active=true]:text-blue-700 data-[active=true]:shadow-sm data-[active=true]:ring-1 data-[active=true]:ring-blue-100 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white dark:data-[active=true]:bg-white/10 dark:data-[active=true]:text-white dark:data-[active=true]:ring-white/10 data-[active=true]:[&_svg]:text-emerald-600"
                        >
                            <Link
                                href={item.href}
                                className="flex h-full w-full items-center gap-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0"
                            >
                                {item.icon && (
                                    <item.icon className="h-4.5 w-4.5 shrink-0 text-slate-400 transition-colors" />
                                )}
                                <span className="truncate group-data-[collapsible=icon]:hidden">
                                    {item.title}
                                </span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    );
}
