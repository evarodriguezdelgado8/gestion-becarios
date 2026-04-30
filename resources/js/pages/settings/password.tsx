import { Head } from '@inertiajs/react';
import { useRef, useEffect } from 'react';
import { toast } from 'sonner'; // Importamos toast
import PasswordController from '@/actions/App/Http/Controllers/Settings/PasswordController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { edit } from '@/routes/user-password';
import type { BreadcrumbItem } from '@/types';
import { Form } from '@inertiajs/react'; // Asegúrate de que este Form es el wrapper de tu starter kit

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Ajustes de contraseña',
        href: edit(),
    },
];

export default function Password() {
    const passwordInput = useRef<HTMLInputElement>(null);
    const currentPasswordInput = useRef<HTMLInputElement>(null);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Ajustes de contraseña" />

            <h1 className="sr-only">Ajustes de contraseña</h1>

            <SettingsLayout>
                <div className="space-y-6">
                    <Heading
                        variant="small"
                        title="Actualizar contraseña"
                        description="Asegúrate de que tu cuenta use una contraseña larga y aleatoria para mantenerla segura"
                    />

                    <Form
                        {...PasswordController.update.form()}
                        options={{ preserveScroll: true }}
                        resetOnError={['password', 'password_confirmation', 'current_password']}
                        resetOnSuccess
                        onError={(errors) => {
                            if (errors.password) passwordInput.current?.focus();
                            if (errors.current_password) currentPasswordInput.current?.focus();
                            
                            // Toast de error opcional
                            toast.error('Error al actualizar', {
                                description: 'Revisa los datos introducidos.'
                            });
                        }}
                        className="space-y-6"
                    >
                        {({ errors, processing, recentlySuccessful }) => {
                            // Usamos un efecto dentro del render prop o manejamos la lógica del toast
                            // Nota: En algunos starters el componente <Form> maneja su propio estado.
                            // Si 'recentlySuccessful' cambia, disparamos el toast.
                            
                            // eslint-disable-next-line react-hooks/rules-of-hooks
                            useEffect(() => {
                                if (recentlySuccessful) {
                                    toast.success('Contraseña actualizada', {
                                        description: 'Tu contraseña ha sido cambiada correctamente.',
                                    });
                                }
                            }, [recentlySuccessful]);

                            return (
                                <>
                                    <div className="grid gap-2">
                                        <Label htmlFor="current_password">Contraseña actual</Label>
                                        <Input
                                            id="current_password"
                                            ref={currentPasswordInput}
                                            name="current_password"
                                            type="password"
                                            autoComplete="current-password"
                                            placeholder="Contraseña actual"
                                        />
                                        <InputError message={errors.current_password} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="password">Nueva contraseña</Label>
                                        <Input
                                            id="password"
                                            ref={passwordInput}
                                            name="password"
                                            type="password"
                                            autoComplete="new-password"
                                            placeholder="Nueva contraseña"
                                        />
                                        <InputError message={errors.password} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="password_confirmation">Confirmar contraseña</Label>
                                        <Input
                                            id="password_confirmation"
                                            name="password_confirmation"
                                            type="password"
                                            autoComplete="new-password"
                                            placeholder="Confirmar contraseña"
                                        />
                                        <InputError message={errors.password_confirmation} />
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <Button disabled={processing}>
                                            {processing ? 'Guardando...' : 'Guardar contraseña'}
                                        </Button>
                                    </div>
                                </>
                            );
                        }}
                    </Form>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}