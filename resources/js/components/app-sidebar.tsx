import { Link, usePage } from '@inertiajs/react';
import { 
    LayoutGrid, 
    School, 
    Users, 
    CheckSquare, 
    Clock, 
    GraduationCap,
    ShieldCheck // Nuevo icono para permisos
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

// Definimos un tipo extendido para incluir los permisos opcionales
interface SidebarNavItem extends NavItem {
    permission?: string;
    role?: string; // Añadimos soporte para filtrar por rol directamente si es necesario
}

const footerNavItems: SidebarNavItem[] = [];

export function AppSidebar() {
    const { auth } = usePage().props as any;
    const userPermissions = auth.user?.permissions || [];
    const userRoles = auth.user?.roles || [];

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
            title: 'Gestión de Becarios',
            href: '/becarios',
            icon: Users,
            permission: 'view interns',
        },
        {
            title: 'Prácticas y Tareas',
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
            title: 'Evaluación y Notas',
            href: '/evaluacion',
            icon: GraduationCap,
            permission: 'evaluate progress',
        },
        // --- SECCIÓN DE ADMINISTRACIÓN ---
        {
            title: 'Roles y Permisos',
            href: '/admin',
            icon: ShieldCheck,
            role: 'admin',
        }
    ];

    const filteredNavItems = allNavItems.filter((item) => {
        // 1. Si tiene restricción de rol (como la matriz de permisos)
        if (item.role && !userRoles.includes(item.role)) return false;
        
        // 2. Si tiene restricción de permiso
        if (item.permission && !userPermissions.includes(item.permission)) return false;
        
        return true;
    });

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
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
