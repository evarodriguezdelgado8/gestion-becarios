import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';
import type { User } from '@/types';

export function UserInfo({
    user,
    showEmail = false,
}: {
    user: User;
    showEmail?: boolean;
}) {
    const getInitials = useInitials();

    return (
        <>
            <Avatar className="h-8 w-8 shrink-0 overflow-hidden rounded-xl ring-1 ring-white/80">
                <AvatarImage
                    src={user.photo_url || user.avatar}
                    alt={user.name}
                    className="object-cover"
                />
                <AvatarFallback className="rounded-xl bg-emerald-50 font-bold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200">
                    {getInitials(user.name)}
                </AvatarFallback>
            </Avatar>
            <div className="grid min-w-0 flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate font-bold text-slate-900 dark:text-white">
                    {user.name}
                </span>
                {showEmail && (
                    <span className="truncate text-xs text-muted-foreground">
                        {user.email}
                    </span>
                )}
            </div>
        </>
    );
}
