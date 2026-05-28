import { Form, Head } from '@inertiajs/react';
import { ShieldBan, ShieldCheck } from 'lucide-react';
import { useState } from 'react';

import TwoFactorRecoveryCodes from '@/components/two-factor-recovery-codes';
import TwoFactorSetupModal from '@/components/two-factor-setup-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useTwoFactorAuth } from '@/hooks/use-two-factor-auth';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { disable, enable, show } from '@/routes/two-factor';
import type { BreadcrumbItem } from '@/types';

type Props = {
    requiresConfirmation?: boolean;
    twoFactorEnabled?: boolean;
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Autenticación en dos pasos',
        href: show(),
    },
];

export default function TwoFactor({
    requiresConfirmation = false,
    twoFactorEnabled = false,
}: Props) {
    const {
        qrCodeSvg,
        hasSetupData,
        manualSetupKey,
        clearSetupData,
        fetchSetupData,
        recoveryCodesList,
        fetchRecoveryCodes,
        errors,
    } = useTwoFactorAuth();
    const [showSetupModal, setShowSetupModal] = useState(false);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Autenticación en dos pasos" />

            <SettingsLayout>
                <Card className="overflow-hidden rounded-3xl border-slate-200 bg-white shadow-sm">
                    <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-5">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                            <ShieldCheck className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="font-black text-slate-900">
                                Autenticación en dos pasos
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Añade una capa extra de seguridad a tu cuenta.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-5 p-6">
                        {twoFactorEnabled ? (
                            <>
                                <Badge className="rounded-xl bg-emerald-50 px-3 py-1 font-black text-emerald-700">
                                    Activado
                                </Badge>
                                <p className="max-w-2xl text-sm text-slate-500">
                                    Con la autenticación en dos pasos activada, se solicitará
                                    un código seguro durante el inicio de sesión.
                                </p>

                                <TwoFactorRecoveryCodes
                                    recoveryCodesList={recoveryCodesList}
                                    fetchRecoveryCodes={fetchRecoveryCodes}
                                    errors={errors}
                                />

                                <Form {...disable.form()}>
                                    {({ processing }) => (
                                        <Button
                                            variant="destructive"
                                            type="submit"
                                            disabled={processing}
                                            className="rounded-xl"
                                        >
                                            <ShieldBan className="h-4 w-4" />
                                            Desactivar 2FA
                                        </Button>
                                    )}
                                </Form>
                            </>
                        ) : (
                            <>
                                <Badge
                                    variant="outline"
                                    className="rounded-xl border-rose-100 bg-rose-50 px-3 py-1 font-black text-rose-700"
                                >
                                    Desactivado
                                </Badge>
                                <p className="max-w-2xl text-sm text-slate-500">
                                    Al activar esta protección, iniciar sesión requerirá un
                                    código generado por una aplicación compatible con TOTP.
                                </p>

                                {hasSetupData ? (
                                    <Button
                                        onClick={() => setShowSetupModal(true)}
                                        className="rounded-xl bg-blue-700 hover:bg-blue-800"
                                    >
                                        <ShieldCheck className="h-4 w-4" />
                                        Continuar configuración
                                    </Button>
                                ) : (
                                    <Form
                                        {...enable.form()}
                                        onSuccess={() => setShowSetupModal(true)}
                                    >
                                        {({ processing }) => (
                                            <Button
                                                type="submit"
                                                disabled={processing}
                                                className="rounded-xl bg-blue-700 hover:bg-blue-800"
                                            >
                                                <ShieldCheck className="h-4 w-4" />
                                                Activar 2FA
                                            </Button>
                                        )}
                                    </Form>
                                )}
                            </>
                        )}
                    </div>
                </Card>

                <TwoFactorSetupModal
                    isOpen={showSetupModal}
                    onClose={() => setShowSetupModal(false)}
                    requiresConfirmation={requiresConfirmation}
                    twoFactorEnabled={twoFactorEnabled}
                    qrCodeSvg={qrCodeSvg}
                    manualSetupKey={manualSetupKey}
                    clearSetupData={clearSetupData}
                    fetchSetupData={fetchSetupData}
                    errors={errors}
                />
            </SettingsLayout>
        </AppLayout>
    );
}
