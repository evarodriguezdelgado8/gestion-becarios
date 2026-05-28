import { Form } from '@inertiajs/react';
import { AlertTriangle } from 'lucide-react';
import { useRef } from 'react';

import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function DeleteUser() {
    const passwordInput = useRef<HTMLInputElement>(null);

    return (
        <Card className="overflow-hidden rounded-3xl border-red-100 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-red-100 px-6 py-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                    <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                    <h2 className="font-black text-slate-900">Eliminar cuenta</h2>
                    <p className="mt-1 text-sm text-slate-500">
                        Esta acción elimina tu cuenta de forma permanente.
                    </p>
                </div>
            </div>

            <div className="space-y-4 p-6">
                <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                    Una vez eliminada, no podrás recuperar esta cuenta ni sus datos
                    asociados.
                </div>

                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="destructive" className="rounded-xl" data-test="delete-user-button">
                            Eliminar cuenta
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="rounded-3xl">
                        <DialogTitle>
                            ¿Estás seguro de que deseas eliminar tu cuenta?
                        </DialogTitle>
                        <DialogDescription>
                            Introduce tu contraseña para confirmar que quieres eliminar la
                            cuenta definitivamente.
                        </DialogDescription>

                        <Form
                            {...ProfileController.destroy.form()}
                            options={{
                                preserveScroll: true,
                            }}
                            onError={() => passwordInput.current?.focus()}
                            resetOnSuccess
                            className="space-y-6"
                        >
                            {({ resetAndClearErrors, processing, errors }) => (
                                <>
                                    <div className="grid gap-2">
                                        <Label htmlFor="password" className="sr-only">
                                            Contraseña
                                        </Label>

                                        <Input
                                            id="password"
                                            type="password"
                                            name="password"
                                            ref={passwordInput}
                                            placeholder="Contraseña"
                                            autoComplete="current-password"
                                        />

                                        <InputError message={errors.password} />
                                    </div>

                                    <DialogFooter className="gap-2">
                                        <DialogClose asChild>
                                            <Button
                                                variant="secondary"
                                                className="rounded-xl"
                                                onClick={() => resetAndClearErrors()}
                                            >
                                                Cancelar
                                            </Button>
                                        </DialogClose>

                                        <Button
                                            variant="destructive"
                                            disabled={processing}
                                            asChild
                                            className="rounded-xl"
                                        >
                                            <button
                                                type="submit"
                                                data-test="confirm-delete-user-button"
                                            >
                                                Eliminar cuenta
                                            </button>
                                        </Button>
                                    </DialogFooter>
                                </>
                            )}
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>
        </Card>
    );
}
