import { Head, usePage, useForm } from '@inertiajs/react';
import { Upload, ImageIcon } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner'; 
import ImageCropper from '@/components/common/ImageCropper';
import DeleteUser from '@/components/delete-user';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
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

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/settings/profile', {
            preserveScroll: true,
            forceFormData: true,
            onError: () => toast.error('Error al guardar', {
                description: 'Por favor, revisa los errores en el formulario.'
            }),
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFileName(file.name);
            const reader = new FileReader();
            reader.onload = () => {
                const result = reader.result as string;
                setOriginalImage(result);
                setTempImage(result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCropFinished = (blob: Blob) => {
        const croppedFile = new File([blob], fileName || 'profile_photo.jpg', { type: 'image/jpeg' });
        setData((prevData) => ({
            ...prevData,
            photo: croppedFile,
            clear_photo: false
        }));
        setTempImage(null);
    };

    const reEditCrop = () => {
        if (originalImage) setTempImage(originalImage);
        else if (user.photo_url) setTempImage(user.photo_url);
    };

    const avatarFallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random&color=fff`;
    const previewUrl = data.photo ? URL.createObjectURL(data.photo) : null;
    const photoToShow = data.clear_photo 
        ? avatarFallback 
        : (previewUrl || user.photo_url || avatarFallback);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Configuración de perfil" />

            <SettingsLayout>
                <div className="space-y-12 pb-10">
                    <section className="space-y-6">
                        <Heading
                            variant="small"
                            title="Información del perfil"
                            description="Actualiza tu nombre, correo electrónico y foto de perfil."
                        />

                        <form onSubmit={submit} className="space-y-6 max-w-3xl">
                            <div className="grid gap-4">
                                <Label>Foto de perfil</Label>
                                <div className="flex items-center gap-6">
                                    <div className="relative group cursor-pointer" onClick={reEditCrop}>
                                        <img
                                            src={photoToShow}
                                            alt={user.name}
                                            className="h-24 w-24 rounded-full object-cover border-2 border-muted shadow-sm transition group-hover:opacity-80"
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-white">
                                            <span className="text-[10px] bg-black/60 px-2 py-1 rounded-full font-medium">Ajustar</span>
                                        </div>
                                    </div>
                                    
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
                                                    onClick={() => fileInputRef.current?.click()}
                                                >
                                                    <Upload className="mr-2 h-4 w-4" />
                                                    Seleccionar foto
                                                </Button>
                                            ) : (
                                                <div className="flex items-center gap-2 bg-secondary/50 px-3 py-1.5 rounded-md border border-border">
                                                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                                                    <span className="text-sm font-medium truncate max-w-[150px]">
                                                        {fileName}
                                                    </span>
                                                    <button 
                                                        type="button"
                                                        onClick={() => fileInputRef.current?.click()}
                                                        className="ml-2 text-xs text-primary hover:underline font-semibold"
                                                    >
                                                        Cambiar
                                                    </button>
                                                </div>
                                            )}

                                            {(user.photo_url || data.photo) && !data.clear_photo && (
                                                <button
                                                    type="button"
                                                    className="text-xs text-red-500 hover:text-red-700 ml-2"
                                                    onClick={() => {
                                                        setData('clear_photo', true);
                                                        setData('photo', null);
                                                        setOriginalImage(null);
                                                        setFileName(null);
                                                        if (fileInputRef.current) fileInputRef.current.value = '';
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

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nombre</Label>
                                    <input 
                                        id="name" 
                                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
                                        value={data.name} 
                                        onChange={(e) => setData('name', e.target.value)} 
                                        required 
                                    />
                                    <InputError message={errors.name} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <input 
                                        id="email" 
                                        type="email" 
                                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
                                        value={data.email} 
                                        onChange={(e) => setData('email', e.target.value)} 
                                        required 
                                    />
                                    <InputError message={errors.email} />
                                </div>
                            </div>

                            <Button disabled={processing} className="w-fit">
                                {processing ? 'Guardando...' : 'Guardar Perfil'}
                            </Button>
                        </form>
                    </section>
                                        
                    <hr className="border-muted" />

                    <section>
                        <DeleteUser />
                    </section>
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