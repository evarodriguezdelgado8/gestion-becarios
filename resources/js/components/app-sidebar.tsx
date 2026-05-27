import { Link, usePage } from '@inertiajs/react';
import {
    CheckSquare,
    Clock,
    FileText,
    GraduationCap,
    LayoutGrid,
    School,
    ShieldCheck,
    Users,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import type { NavItem } from '@/types';

interface SidebarNavItem extends NavItem {
    permission?: string;
    role?: string;
}

const footerNavItems: SidebarNavItem[] = [];

export function AppSidebar() {
    const { auth } = usePage().props as any;
    const userPermissions = auth.user?.permissions || [];
    const userRoles = auth.user?.roles || [];
    const userRoleNames = userRoles.map((role: any) =>
        typeof role === 'object' ? role.name : role,
    );

    const allNavItems: SidebarNavItem[] = [
        {
            title: 'Dashboard',
            href: '/dashboard',
            icon: LayoutGrid,
        },
        {
            title: 'Centros Educativos',
            href: '/centros',
            icon: School,
            permission: 'view centers',
        },
        {
            title: 'Gestion de Becarios',
            href: '/becarios',
            icon: Users,
            permission: 'view interns',
        },
        {
            title: 'Practicas y Tareas',
            href: '/tareas',
            icon: CheckSquare,
            permission: 'view own tasks',
        },
        {
            title: 'Control Horario',
            href: '/control-horario',
            icon: Clock,
            permission: 'view own tasks',
        },
        {
            title: 'Evaluacion y Notas',
            href: '/evaluaciones',
            icon: GraduationCap,
            role: 'tutor',
        },
        {
            title: 'Evaluacion y Notas',
            href: '/evaluaciones',
            icon: GraduationCap,
            role: 'admin',
        },
        {
            title: 'Mis Evaluaciones',
            href: '/mis-evaluaciones',
            icon: GraduationCap,
            role: 'intern',
        },
        {
            title: 'Reportes',
            href: '/reportes',
            icon: FileText,
            role: 'tutor',
        },
        {
            title: 'Reportes',
            href: '/reportes',
            icon: FileText,
            role: 'admin',
        },
        {
            title: 'Roles y Permisos',
            href: '/admin',
            icon: ShieldCheck,
            role: 'admin',
        },
    ];

    const filteredNavItems = allNavItems.filter((item) => {
        if (item.role && !userRoleNames.includes(item.role)) return false;

        if (item.permission && !userPermissions.includes(item.permission))
            return false;

        return true;
    });

    return (
        <Sidebar
            collapsible="icon"
            variant="inset"
            className="[&_[data-sidebar=sidebar]]:rounded-2xl [&_[data-sidebar=sidebar]]:border [&_[data-sidebar=sidebar]]:border-sidebar-border/80 [&_[data-sidebar=sidebar]]:shadow-xl [&_[data-sidebar=sidebar]]:shadow-slate-200/60 dark:[&_[data-sidebar=sidebar]]:shadow-none"
        >
            <SidebarHeader className="border-b border-sidebar-border/70 px-3 py-3 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-1.5">
                <SidebarMenu className="group-data-[collapsible=icon]:items-center">
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            size="lg"
                            asChild
                            className="h-13 rounded-2xl px-2 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 hover:bg-white/70 data-[state=open]:bg-white/80"
                        >
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="px-1 py-3 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-1.5">
                <NavMain items={filteredNavItems} />
            </SidebarContent>

            <SidebarFooter className="border-t border-sidebar-border/70 px-3 py-3 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-1.5">
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
