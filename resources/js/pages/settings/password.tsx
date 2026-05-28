import { Form, Head } from '@inertiajs/react';
import { KeyRound, LockKeyhole } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

import PasswordController from '@/actions/App/Http/Controllers/Settings/PasswordController';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { edit } from '@/routes/user-password';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Ajustes de contraseña',
        href: edit(),
    },
];

function PasswordSuccessToast({ recentlySuccessful }: { recentlySuccessful: boolean }) {
    useEffect(() => {
        if (recentlySuccessful) {
            toast.success('Contraseña actualizada', {
                description: 'Tu contraseña ha sido cambiada correctamente.',
            });
        }
    }, [recentlySuccessful]);

    return null;
}

export default function Password() {
    const passwordInput = useRef<HTMLInputElement>(null);
    const currentPasswordInput = useRef<HTMLInputElement>(null);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Ajustes de contraseña" />

            <SettingsLayout>
                <Card className="overflow-hidden rounded-3xl border-slate-200 bg-white shadow-sm">
                    <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-5">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                            <KeyRound className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="font-black text-slate-900">
                                Actualizar contraseña
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Usa una contraseña larga y única para proteger tu cuenta.
                            </p>
                        </div>
                    </div>

                    <Form
                        {...PasswordController.update.form()}
                        options={{ preserveScroll: true }}
                        resetOnError={['password', 'password_confirmation', 'current_password']}
                        resetOnSuccess
                        onError={(errors) => {
                            if (errors.password) passwordInput.current?.focus();
                            if (errors.current_password) currentPasswordInput.current?.focus();

                            toast.error('Error al actualizar', {
                                description: 'Revisa los datos introducidos.',
                            });
                        }}
                        className="space-y-5 p-6"
                    >
                        {({ errors, processing, recentlySuccessful }) => (
                            <>
                                <PasswordSuccessToast recentlySuccessful={recentlySuccessful} />

                                <div className="grid gap-2">
                                    <Label htmlFor="current_password">
                                        Contraseña actual
                                    </Label>
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
                                    <Label htmlFor="password_confirmation">
                                        Confirmar contraseña
                                    </Label>
                                    <Input
                                        id="password_confirmation"
                                        name="password_confirmation"
                                        type="password"
                                        autoComplete="new-password"
                                        placeholder="Confirmar contraseña"
                                    />
                                    <InputError message={errors.password_confirmation} />
                                </div>

                                <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                                    <LockKeyhole className="mr-2 inline h-4 w-4 text-slate-400" />
                                    Evita reutilizar contraseñas de otros servicios.
                                </div>

                                <Button
                                    disabled={processing}
                                    className="rounded-xl bg-blue-700 hover:bg-blue-800"
                                >
                                    {processing ? 'Guardando...' : 'Guardar contraseña'}
                                </Button>
                            </>
                        )}
                    </Form>
                </Card>
            </SettingsLayout>
        </AppLayout>
    );
}
