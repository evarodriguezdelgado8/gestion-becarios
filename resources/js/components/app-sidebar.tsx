import { Link, usePage } from '@inertiajs/react'; // Importamos usePage
import { BookOpen, FolderGit2, LayoutGrid, School, Users, CheckSquare, Clock, GraduationCap } from 'lucide-react';
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
import {controlHorario, dashboard, evaluacion} from '@/routes';
import type { NavItem } from '@/types';

const footerNavItems: NavItem[] = [
    
];

export function AppSidebar() {
    const { auth } = usePage().props as any;
    const roles = auth.user?.roles || [];

    const allNavItems: NavItem[] = [
        {
            title: 'Dashboard',
            href:'/dashboard',
            icon: LayoutGrid,
        },
        {
            title: 'Centros Educativos',
            href: '/centros', 
            icon: School,
            roles: ['admin', 'tutor'], 
        },
        {
            title: 'Gestión de Becarios',
            href: '/becarios',
            icon: Users,
            roles: ['admin', 'tutor'],
        },
        {
            title: 'Prácticas y Tareas',
            href: '/tareas',
            icon: CheckSquare,
            roles: ['admin','tutor', 'intern'], 
        },
        {
            title: 'Control Horario',
            href: '/control-horario',
            icon: Clock,
            roles: ['admin' ,'tutor', 'intern'],
        },
        {
            title: 'Evaluación y Notas',
            href: '/evaluacion',
            icon: GraduationCap,
            roles: ['admin','tutor', 'intern'],
        }
    ];

    const filteredNavItems = allNavItems.filter(item => {
        if (!item.roles) return true;
        return item.roles.some(role => roles.includes(role));
    });

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={filteredNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}