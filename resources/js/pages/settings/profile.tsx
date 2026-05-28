import { Head, useForm, usePage } from '@inertiajs/react';
import { ImageIcon, Upload } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import ImageCropper from '@/components/common/ImageCropper';
import DeleteUser from '@/components/delete-user';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Configuración de perfil', href: '/settings/profile' },
];

export default function Profile() {
    const { auth } = usePage().props;
    const user = auth.user as any;
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [tempImage, setTempImage] = useState<string | null>(null);
    const [originalImage, setOriginalImage] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);

    const { data, setData, post, processing, errors, recentlySuccessful } = useForm({
        name: user.name || '',
        email: user.email || '',
        photo: null as File | null,
        clear_photo: false,
    });

    useEffect(() => {
        if (recentlySuccessful) {
            toast.success('Cambios guardados', {
                description: 'Tu perfil se ha actualizado correctamente.',
            });
        }
    }, [recentlySuccessful]);

    const submit = (event: React.FormEvent) => {
        event.preventDefault();

        post('/settings/profile', {
            preserveScroll: true,
            forceFormData: true,
            onError: () =>
                toast.error('Error al guardar', {
                    description: 'Por favor, revisa los errores en el formulario.',
                }),
        });
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];

        if (!file) return;

        setFileName(file.name);
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            setOriginalImage(result);
            setTempImage(result);
        };
        reader.readAsDataURL(file);
    };

    const handleCropFinished = (blob: Blob) => {
        const croppedFile = new File([blob], fileName || 'profile_photo.jpg', {
            type: 'image/jpeg',
        });

        setData((current) => ({
            ...current,
            photo: croppedFile,
            clear_photo: false,
        }));
        setTempImage(null);
    };

    const reEditCrop = () => {
        if (originalImage) {
            setTempImage(originalImage);
            return;
        }

        if (user.photo_url) {
            setTempImage(user.photo_url);
        }
    };

    const avatarFallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random&color=fff`;
    const previewUrl = data.photo ? URL.createObjectURL(data.photo) : null;
    const photoToShow = data.clear_photo
        ? avatarFallback
        : previewUrl || user.photo_url || avatarFallback;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Configuración de perfil" />

            <SettingsLayout>
                <div className="space-y-6">
                    <Card className="overflow-hidden rounded-3xl border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-100 px-6 py-5">
                            <h2 className="font-black text-slate-900">
                                Información del perfil
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Actualiza tu nombre, correo electrónico y foto de perfil.
                            </p>
                        </div>

                        <form onSubmit={submit} className="space-y-6 p-6">
                            <div className="grid gap-3">
                                <Label className="text-xs font-bold uppercase text-slate-400">
                                    Foto de perfil
                                </Label>
                                <div className="flex flex-col gap-5 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 sm:flex-row sm:items-center">
                                    <button
                                        type="button"
                                        className="group relative h-24 w-24 shrink-0 cursor-pointer overflow-hidden rounded-3xl border-2 border-white shadow-sm ring-1 ring-slate-200"
                                        onClick={reEditCrop}
                                    >
                                        <img
                                            src={photoToShow}
                                            alt={user.name}
                                            className="h-full w-full object-cover transition group-hover:opacity-80"
                                        />
                                        <span className="absolute inset-0 flex items-center justify-center opacity-0 transition group-hover:opacity-100">
                                            <span className="rounded-full bg-black/60 px-2 py-1 text-[10px] font-medium text-white">
                                                Ajustar
                                            </span>
                                        </span>
                                    </button>

                                    <div className="flex flex-col gap-3">
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleFileChange}
                                        />

                                        <div className="flex flex-wrap items-center gap-2">
                                            {!data.photo ? (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    className="rounded-xl bg-white"
                                                    onClick={() => fileInputRef.current?.click()}
                                                >
                                                    <Upload className="h-4 w-4" />
                                                    Seleccionar foto
                                                </Button>
                                            ) : (
                                                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5">
                                                    <ImageIcon className="h-4 w-4 text-slate-400" />
                                                    <span className="max-w-[150px] truncate text-sm font-medium text-slate-700">
                                                        {fileName}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => fileInputRef.current?.click()}
                                                        className="ml-2 text-xs font-bold text-blue-700 hover:underline"
                                                    >
                                                        Cambiar
                                                    </button>
                                                </div>
                                            )}

                                            {(user.photo_url || data.photo) && !data.clear_photo && (
                                                <button
                                                    type="button"
                                                    className="ml-2 text-xs font-bold text-red-500 hover:text-red-700"
                                                    onClick={() => {
                                                        setData('clear_photo', true);
                                                        setData('photo', null);
                                                        setOriginalImage(null);
                                                        setFileName(null);

                                                        if (fileInputRef.current) {
                                                            fileInputRef.current.value = '';
                                                        }
                                                    }}
                                                >
                                                    Eliminar
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <InputError message={errors.photo} />
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nombre</Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(event) =>
                                            setData('name', event.target.value)
                                        }
                                        required
                                    />
                                    <InputError message={errors.name} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={data.email}
                                        onChange={(event) =>
                                            setData('email', event.target.value)
                                        }
                                        required
                                    />
                                    <InputError message={errors.email} />
                                </div>
                            </div>

                            <Button
                                disabled={processing}
                                className="w-fit rounded-xl bg-blue-700 hover:bg-blue-800"
                            >
                                {processing ? 'Guardando...' : 'Guardar perfil'}
                            </Button>
                        </form>
                    </Card>

                    <DeleteUser />
                </div>
            </SettingsLayout>

            {tempImage && (
                <ImageCropper
                    image={tempImage}
                    onCropComplete={handleCropFinished}
                    onCancel={() => setTempImage(null)}
                />
            )}
        </AppLayout>
    );
}
