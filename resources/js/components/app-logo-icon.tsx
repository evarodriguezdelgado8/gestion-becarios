import type { ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export default function AppLogoIcon({
    alt = 'EduTrack',
    className,
    ...props
}: ImgHTMLAttributes<HTMLImageElement>) {
    return (
        <img
            {...props}
            src="/images/edutrack-icon.png"
            alt={alt}
            className={cn('aspect-square object-contain', className)}
        />
    );
}
