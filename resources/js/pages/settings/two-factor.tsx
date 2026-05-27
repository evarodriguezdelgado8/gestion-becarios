import { Form, Head } from '@inertiajs/react';
import { ShieldBan, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import Heading from '@/components/heading';
import TwoFactorRecoveryCodes from '@/components/two-factor-recovery-codes';
import TwoFactorSetupModal from '@/components/two-factor-setup-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
    const [showSetupModal, setShowSetupModal] = useState<boolean>(false);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Autenticación en dos pasos" />
            <h1 className="sr-only">Ajustes de autenticación en dos pasos</h1>

            <SettingsLayout>
                <div className="space-y-6">
                    <Heading
                        variant="small"
                        title="Autenticación en dos pasos"
                        description="Gestiona los ajustes de seguridad de tu cuenta"
                    />
                    
                    {twoFactorEnabled ? (
                        <div className="flex flex-col items-start justify-start space-y-4">
                            <Badge variant="default">Activado</Badge>
                            <p className="text-muted-foreground text-sm">
                                Con la autenticación de dos pasos activada, se te solicitará un pin seguro 
                                y aleatorio durante el inicio de sesión, el cual puedes obtener desde la 
                                aplicación compatible con TOTP en tu teléfono.
                            </p>

                            <TwoFactorRecoveryCodes
                                recoveryCodesList={recoveryCodesList}
                                fetchRecoveryCodes={fetchRecoveryCodes}
                                errors={errors}
                            />

                            <Form {...disable.form()}>
                                {({ processing }) => (
                                    <Button variant="destructive" type="submit" disabled={processing}>
                                        <ShieldBan className="mr-2 h-4 w-4" /> Desactivar 2FA
                                    </Button>
                                )}
                            </Form>
                        </div>
                    ) : (
                        <div className="flex flex-col items-start justify-start space-y-4">
                            <Badge variant="destructive">Desactivado</Badge>
                            <p className="text-muted-foreground text-sm">
                                Cuando activas la autenticación de dos pasos, se te solicitará un pin seguro 
                                durante el inicio de sesión. Puedes obtener este pin desde una aplicación 
                                compatible con TOTP en tu teléfono.
                            </p>

                            <div>
                                {hasSetupData ? (
                                    <Button onClick={() => setShowSetupModal(true)}>
                                        <ShieldCheck className="mr-2 h-4 w-4" /> Continuar configuración
                                    </Button>
                                ) : (
                                    <Form {...enable.form()} onSuccess={() => setShowSetupModal(true)}>
                                        {({ processing }) => (
                                            <Button type="submit" disabled={processing}>
                                                <ShieldCheck className="mr-2 h-4 w-4" /> Activar 2FA
                                            </Button>
                                        )}
                                    </Form>
                                )}
                            </div>
                        </div>
                    )}

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
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
