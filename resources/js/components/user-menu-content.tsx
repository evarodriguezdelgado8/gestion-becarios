import { Link, router } from '@inertiajs/react';
import { LogOut, Settings, User } from 'lucide-react'; // Añadido icono User
import {
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { UserInfo } from '@/components/user-info';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { logout } from '@/routes';
import { edit } from '@/routes/profile';
import type { User as UserType } from '@/types'; // Renombrado para evitar conflicto con el icono

type Props = {
    user: UserType;
};

export function UserMenuContent({ user }: Props) {
    const cleanup = useMobileNavigation();

    const handleLogout = () => {
        cleanup();
        router.flushAll();
    };

    return (
        <>
            <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    {/* Gracias a los cambios en UserInfo, aquí ya saldrá la foto */}
                    <UserInfo user={user} showEmail={true} />
                </div>
            </DropdownMenuLabel>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                    <Link
                        className="flex w-full cursor-pointer items-center"
                        href={edit()}
                        prefetch
                        onClick={cleanup}
                    >
                        <User className="mr-2 h-4 w-4" />
                        <span>Perfil</span>
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link
                        className="flex w-full cursor-pointer items-center"
                        href="/settings/password"
                        prefetch
                        onClick={cleanup}
                    >
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Configuración</span>
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuGroup>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem asChild>
                <Link
                    className="flex w-full cursor-pointer items-center text-red-600 focus:text-red-600 dark:text-red-400"
                    href={logout()}
                    method="post"
                    as="button"
                    onClick={handleLogout}
                    data-test="logout-button"
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Cerrar sesión</span>
                </Link>
            </DropdownMenuItem>
        </>
    );
}