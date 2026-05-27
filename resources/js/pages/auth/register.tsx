import { Head } from '@inertiajs/react';
import TextLink from '@/components/text-link';
import AuthLayout from '@/layouts/auth-layout';
import { login } from '@/routes';

export default function Register() {
    return (
        <AuthLayout
            title="Registro no disponible"
            description="Las cuentas de becario se activan mediante invitacion del tutor o administrador."
        >
            <Head title="Registro no disponible" />
            <div className="text-center text-sm text-muted-foreground">
                Si ya has recibido una invitacion, usa el enlace del correo para
                crear tu contrasena.
            </div>
            <div className="text-center text-sm text-muted-foreground">
                <TextLink href={login()} tabIndex={1}>
                    Volver al inicio de sesion
                </TextLink>
            </div>
        </AuthLayout>
    );
}
