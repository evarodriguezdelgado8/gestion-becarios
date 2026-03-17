import { Head, useForm, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Center, BreadcrumbItem } from '@/types';
import { Globe, MapPin, User, Mail, Phone } from 'lucide-react';

export default function Form({ center }: { center?: Center }) {
    const isEditing = !!center;

    const { data, setData, post, put, processing, errors } = useForm({
        nif: center?.nif || '',
        name: center?.name || '',
        address: center?.address || '',
        phone: center?.phone || '',
        email: center?.email || '',
        web: center?.web || '',
        
        contact_name: center?.contact_name || '',
        contact_role: center?.contact_role || '',
        contact_phone: center?.contact_phone || '',
        contact_email: center?.contact_email || '',
    });

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Centros Educativos', href: '/centros' },
        { title: isEditing ? 'Editar Centro' : 'Nuevo Centro', href: '#' },
    ];

    const handleSubmit = (e: React.SyntheticEvent) => {
        e.preventDefault();
        if (isEditing) {
            put(`/centros/${center.id}`);
        } else {
            post('/centros');
        }
    };

return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={isEditing ? 'Editar Centro' : 'Nuevo Centro'} />

            <div className="py-6 md:py-12 px-4">
                <div className="max-w-4xl mx-auto">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                                <h3 className="text-lg font-bold text-blue-900 flex items-center gap-2">
                                    <Globe className="w-5 h-5 text-blue-600" />
                                    Datos de la Institución
                                </h3>
                            </div>
                            
                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre del Centro <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        className={`w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-all ${errors.name ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                                        placeholder="Ej: IES Tecnológico"
                                    />
                                    {errors.name && <p className="text-red-500 text-xs mt-1 font-medium">{errors.name}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">NIF / CIF <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        value={data.nif}
                                        onChange={(e) => setData('nif', e.target.value)}
                                        className={`w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-all ${errors.nif ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                                    />
                                    {errors.nif && <p className="text-red-500 text-xs mt-1 font-medium">{errors.nif}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Web (Opcional)</label>
                                    <input
                                        type="url"
                                        placeholder="https://..."
                                        value={data.web}
                                        onChange={(e) => setData('web', e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                    {errors.web && <p className="text-red-500 text-xs mt-1 font-medium">{errors.web}</p>}
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Dirección <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <MapPin className={`absolute left-3 top-3 w-4 h-4 ${errors.address ? 'text-red-400' : 'text-gray-400'}`} />
                                        <input
                                            type="text"
                                            value={data.address}
                                            onChange={(e) => setData('address', e.target.value)}
                                            className={`w-full border rounded-lg pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-all ${errors.address ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                                        />
                                    </div>
                                    {errors.address && <p className="text-red-500 text-xs mt-1 font-medium">{errors.address}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Teléfono <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        value={data.phone}
                                        onChange={(e) => setData('phone', e.target.value)}
                                        className={`w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-all ${errors.phone ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                                    />
                                    {errors.phone && <p className="text-red-500 text-xs mt-1 font-medium">{errors.phone}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Email Centro <span className="text-red-500">*</span></label>
                                    <input
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        className={`w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-all ${errors.email ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                                    />
                                    {errors.email && <p className="text-red-500 text-xs mt-1 font-medium">{errors.email}</p>}
                                </div>
                            </div>
                        </div>

                        <div className="bg-blue-50/30 rounded-xl shadow-sm border border-blue-100 overflow-hidden">
                            <div className="bg-blue-600 px-6 py-3">
                                <h3 className="text-md font-bold text-white flex items-center gap-2">
                                    <User className="w-4 h-4" />
                                    Persona de Contacto
                                </h3>
                            </div>
                            
                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Nombre Completo <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        value={data.contact_name}
                                        onChange={(e) => setData('contact_name', e.target.value)}
                                        className={`w-full border rounded-lg p-2.5 mt-1 focus:ring-2 focus:ring-blue-500 outline-none transition-all ${errors.contact_name ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                                    />
                                    {errors.contact_name && <p className="text-red-500 text-xs mt-1 font-medium">{errors.contact_name}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Cargo <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        value={data.contact_role}
                                        onChange={(e) => setData('contact_role', e.target.value)}
                                        className={`w-full border rounded-lg p-2.5 mt-1 focus:ring-2 focus:ring-blue-500 outline-none transition-all ${errors.contact_role ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                                    />
                                    {errors.contact_role && <p className="text-red-500 text-xs mt-1 font-medium">{errors.contact_role}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Teléfono <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        value={data.contact_phone}
                                        onChange={(e) => setData('contact_phone', e.target.value)}
                                        className={`w-full border rounded-lg p-2.5 mt-1 focus:ring-2 focus:ring-blue-500 outline-none transition-all ${errors.contact_phone ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                                    />
                                    {errors.contact_phone && <p className="text-red-500 text-xs mt-1 font-medium">{errors.contact_phone}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Email <span className="text-red-500">*</span></label>
                                    <input
                                        type="email"
                                        value={data.contact_email}
                                        onChange={(e) => setData('contact_email', e.target.value)}
                                        className={`w-full border rounded-lg p-2.5 mt-1 focus:ring-2 focus:ring-blue-500 outline-none transition-all ${errors.contact_email ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                                    />
                                    {errors.contact_email && <p className="text-red-500 text-xs mt-1 font-medium">{errors.contact_email}</p>}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => router.get('/centros')}
                                className="order-2 sm:order-1 px-8 py-2.5 text-sm font-bold text-gray-500 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={processing}
                                className="order-1 sm:order-2 px-8 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-md shadow-blue-200 disabled:opacity-50 transition-all"
                            >
                                {processing ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Registrar Centro'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}