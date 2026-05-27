import { Form, Head } from '@inertiajs/react';
import { BarChart3, CheckCircle2, Clock3, GraduationCap } from 'lucide-react';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { store } from '@/routes/login';
import { request } from '@/routes/password';

type Props = {
    status?: string;
    canResetPassword: boolean;
    canRegister: boolean;
};

const highlights = [
    {
        icon: GraduationCap,
        label: 'Becarios',
        text: 'Seguimiento academico y periodo de practicas.',
    },
    {
        icon: Clock3,
        label: 'Horario',
        text: 'Fichajes, ausencias y progreso de horas.',
    },
    {
        icon: BarChart3,
        label: 'Reportes',
        text: 'Indicadores, tareas y evaluaciones en un solo lugar.',
    },
];

export default function Login({ status, canResetPassword }: Props) {
    return (
        <>
            <Head title="Iniciar sesion" />

            <main className="relative min-h-svh overflow-hidden bg-[linear-gradient(135deg,#f8fafc_0%,#e8f2ff_45%,#e8fff4_100%)] text-slate-950">
                <img
                    src="/images/edutrack-icon.png"
                    alt=""
                    aria-hidden="true"
                    className="pointer-events-none absolute -top-20 -left-20 h-[420px] w-[420px] rotate-[-8deg] object-contain opacity-[0.055]"
                />
                <img
                    src="/images/edutrack-icon.png"
                    alt=""
                    aria-hidden="true"
                    className="pointer-events-none absolute right-[-140px] bottom-[-170px] h-[520px] w-[520px] rotate-[10deg] object-contain opacity-[0.07]"
                />

                <div className="relative grid min-h-svh lg:grid-cols-[1.05fr_0.95fr]">
                    <section className="flex items-center px-6 py-10 sm:px-10 lg:px-16">
                        <div className="mx-auto w-full max-w-xl">
                            <div className="flex items-center gap-5">
                                <img
                                    src="/images/edutrack-icon.png"
                                    alt="EduTrack"
                                    className="h-24 w-24 rounded-[1.6rem] bg-white object-contain p-2.5 shadow-xl ring-1 shadow-blue-200/60 ring-white"
                                />
                                <div>
                                    <p className="text-3xl leading-none font-black tracking-normal text-slate-950">
                                        EduTrack
                                    </p>
                                    <p className="mt-2 text-sm font-semibold text-emerald-700">
                                        Gestion integral de practicas
                                    </p>
                                </div>
                            </div>

                            <div className="mt-10">
                                <h1 className="max-w-lg text-4xl leading-tight font-black tracking-normal text-slate-950 sm:text-5xl">
                                    Coordina practicas, tareas y evaluaciones
                                    con claridad.
                                </h1>
                                <p className="mt-5 max-w-lg text-base leading-7 font-medium text-slate-600">
                                    Accede a tu panel para revisar becarios,
                                    fichajes, tareas, reportes y notas segun tu
                                    rol.
                                </p>
                            </div>

                            <div className="mt-8 grid gap-3 sm:grid-cols-3">
                                {highlights.map((item) => (
                                    <div
                                        key={item.label}
                                        className="rounded-2xl border border-white/80 bg-white/75 p-4 shadow-sm shadow-slate-200/70 backdrop-blur"
                                    >
                                        <item.icon className="h-5 w-5 text-emerald-600" />
                                        <p className="mt-3 text-sm font-black text-slate-900">
                                            {item.label}
                                        </p>
                                        <p className="mt-1 text-xs leading-5 font-medium text-slate-500">
                                            {item.text}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    <section className="flex items-center px-6 py-10 sm:px-10 lg:px-16">
                        <div className="mx-auto w-full max-w-md rounded-3xl border border-white/80 bg-white/90 p-6 shadow-2xl shadow-blue-200/50 backdrop-blur sm:p-8">
                            <div className="mb-8">
                                
                                <h2 className="text-2xl font-black text-slate-950">
                                    Iniciar sesion
                                </h2>
                                <p className="mt-2 text-sm font-medium text-slate-500">
                                    Entra con el correo de tu cuenta EduTrack.
                                </p>
                            </div>

                            {status && (
                                <div className="mb-5 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                                    {status}
                                </div>
                            )}

                            <Form
                                {...store.form()}
                                resetOnSuccess={['password']}
                                className="flex flex-col gap-6"
                            >
                                {({ processing, errors }) => (
                                    <>
                                        <div className="grid gap-5">
                                            <div className="grid gap-2">
                                                <Label htmlFor="email">
                                                    Email
                                                </Label>
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    name="email"
                                                    required
                                                    autoFocus
                                                    tabIndex={1}
                                                    autoComplete="email"
                                                    placeholder="nombre@ejemplo.com"
                                                    className="h-11 rounded-xl"
                                                />
                                                <InputError
                                                    message={errors.email}
                                                />
                                            </div>

                                            <div className="grid gap-2">
                                                <div className="flex items-center">
                                                    <Label htmlFor="password">
                                                        Contraseña
                                                    </Label>
                                                    {canResetPassword && (
                                                        <TextLink
                                                            href={request()}
                                                            className="ml-auto text-sm"
                                                            tabIndex={5}
                                                        >
                                                            Recuperar
                                                        </TextLink>
                                                    )}
                                                </div>
                                                <Input
                                                    id="password"
                                                    type="password"
                                                    name="password"
                                                    required
                                                    tabIndex={2}
                                                    autoComplete="current-password"
                                                    placeholder="Tu contraseña"
                                                    className="h-11 rounded-xl"
                                                />
                                                <InputError
                                                    message={errors.password}
                                                />
                                            </div>

                                            <div className="flex items-center space-x-3">
                                                <Checkbox
                                                    id="remember"
                                                    name="remember"
                                                    tabIndex={3}
                                                />
                                                <Label
                                                    htmlFor="remember"
                                                    className="text-sm text-slate-600"
                                                >
                                                    Recordarme
                                                </Label>
                                            </div>

                                            <Button
                                                type="submit"
                                                className="h-11 w-full rounded-xl bg-emerald-600 font-bold hover:bg-emerald-700"
                                                tabIndex={4}
                                                disabled={processing}
                                                data-test="login-button"
                                            >
                                                {processing && <Spinner />}
                                                Entrar
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </Form>

                            <p className="mt-6 text-center text-xs leading-5 font-medium text-slate-400">
                                Las cuentas se activan mediante invitacion del
                                tutor o administrador.
                            </p>
                        </div>
                    </section>
                </div>
            </main>
        </>
    );
}
