import React from 'react';
import { Center } from '@/types';
import { Link as InertiaLink } from '@inertiajs/react';
import { FileText, User, Building2, Clock } from 'lucide-react';

interface Props {
    data: any;
    setData: (key: string, value: any) => void;
    errors: any;
    processing: boolean;
    centers: Center[];
    submitText: string;
    isEdit?: boolean;
}

export default function InternForm({ data, setData, errors, processing, centers, submitText, isEdit }: Props) {
    const inputClasses = (error: string) => `
        w-full px-4 py-2.5 bg-white border rounded-lg shadow-sm transition-all duration-200
        ${error 
            ? 'border-red-500 focus:ring-red-200 focus:border-red-500' 
            : 'border-gray-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 hover:border-gray-400'}
        text-gray-900 text-sm placeholder:text-gray-400 outline-none
    `;

    const Label = ({ children, required = false }: { children: React.ReactNode, required?: boolean }) => (
        <label className="text-sm font-bold text-gray-800 ml-1">
            {children} {required && <span className="text-red-500">*</span>}
        </label>
    );

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <User className="w-5 h-5 text-gray-400" /> Datos Personales
                    </h2>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                        <Label required>Nombre</Label>
                        <input 
                            type="text" 
                            value={data.name} 
                            onChange={e => setData('name', e.target.value)}
                            className={inputClasses(errors.name)}
                            placeholder="Introduce el nombre"
                        />
                        {errors.name && <p className="text-red-500 text-xs mt-1 italic">{errors.name}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <Label required>Apellidos</Label>
                        <input 
                            type="text" 
                            value={data.last_name} 
                            onChange={e => setData('last_name', e.target.value)}
                            className={inputClasses(errors.last_name)}
                            placeholder="Apellidos completos"
                        />
                        {errors.last_name && <p className="text-red-500 text-xs mt-1 italic">{errors.last_name}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <Label required>DNI / NIE</Label>
                        <input 
                            type="text" 
                            value={data.dni} 
                            onChange={e => setData('dni', e.target.value)}
                            className={inputClasses(errors.dni)}
                            placeholder="12345678X"
                        />
                        {errors.dni && <p className="text-red-500 text-xs mt-1 italic">{errors.dni}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <Label required>Email</Label>
                        <input 
                            type="email" 
                            value={data.email} 
                            onChange={e => setData('email', e.target.value)}
                            className={inputClasses(errors.email)}
                            placeholder="ejemplo@correo.com"
                        />
                        {errors.email && <p className="text-red-500 text-xs mt-1 italic">{errors.email}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <Label required>Teléfono</Label>
                        <input 
                            type="text" 
                            value={data.phone} 
                            onChange={e => setData('phone', e.target.value)}
                            className={inputClasses(errors.phone)}
                            placeholder="600 000 000"
                        />
                        {errors.phone && <p className="text-red-500 text-xs mt-1 italic">{errors.phone}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <Label required>Dirección</Label>
                        <input 
                            type="text" 
                            value={data.address} 
                            onChange={e => setData('address', e.target.value)}
                            className={inputClasses(errors.address)}
                            placeholder="Calle, número, planta..."
                        />
                        {errors.address && (
                            <p className="text-red-500 text-xs mt-1 italic font-medium">
                                {errors.address}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-gray-400" /> Información Académica
                    </h2>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                        <Label required>Centro Educativo</Label>
                        <select 
                            value={data.center_id} 
                            onChange={e => setData('center_id', e.target.value)}
                            className={inputClasses(errors.center_id)}
                        >
                            <option value="">Seleccione un centro</option>
                            {centers.map(center => (
                                <option key={center.id} value={center.id}>{center.name}</option>
                            ))}
                        </select>
                        {errors.center_id && <p className="text-red-500 text-xs mt-1 italic">{errors.center_id}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <Label required>Ciclo Formativo</Label>
                        <input 
                            type="text" 
                            value={data.academic_cycle} 
                            onChange={e => setData('academic_cycle', e.target.value)}
                            placeholder="Ej: DAW, ASIR..."
                            className={inputClasses(errors.academic_cycle)}
                        />
                        {errors.academic_cycle && <p className="text-red-500 text-xs mt-1 italic">{errors.academic_cycle}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <Label required>Horas Totales</Label>
                        <input 
                            type="number" 
                            value={data.total_hours} 
                            onChange={e => setData('total_hours', e.target.value)}
                            className={inputClasses(errors.total_hours)}
                        />
                        {errors.total_hours && <p className="text-red-500 text-xs mt-1 italic">{errors.total_hours}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <Label required>Horas Completadas</Label>
                        <input 
                            type="number" 
                            value={data.completed_hours} 
                            onChange={e => setData('completed_hours', e.target.value)}
                            className={`${inputClasses(errors.completed_hours)} ${isEdit ? 'bg-blue-50/20' : ''}`}
                        />
                        {errors.completed_hours && <p className="text-red-500 text-xs mt-1 italic">{errors.completed_hours}</p>}
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-gray-400" /> Seguimiento de Prácticas
                    </h2>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                        <Label required>Tutor Académico (Centro)</Label>
                        <input 
                            type="text" 
                            value={data.academic_tutor} 
                            onChange={e => setData('academic_tutor', e.target.value)}
                            placeholder="Nombre del tutor del instituto"
                            className={inputClasses(errors.academic_tutor)}
                        />
                        {errors.academic_tutor && <p className="text-red-500 text-xs mt-1 italic">{errors.academic_tutor}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-bold text-gray-800 ml-1">
                            Estado del Becario <span className="text-red-500">*</span>
                        </label>
                        <select 
                            value={data.status} 
                            onChange={e => setData('status', e.target.value as any)}
                            className={inputClasses(errors.status)}
                        >
                            <option value="">Seleccione un estado</option>
                            <option value="active">Activo</option>
                            <option value="finished">Finalizado</option>
                            <option value="abandoned">Abandonado</option>
                        </select>
                        {errors.status && (
                            <p className="text-red-500 text-xs mt-1 italic font-medium">
                                {errors.status}
                            </p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <Label required>Fecha de Inicio</Label>
                        <input 
                            type="date" 
                            value={data.start_date} 
                            onChange={e => setData('start_date', e.target.value)}
                            className={inputClasses(errors.start_date)}
                        />
                        {errors.start_date && <p className="text-red-500 text-xs mt-1 italic">{errors.start_date}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <Label required>Fecha de Finalización</Label>
                        <input 
                            type="date"                 
                            value={data.end_date} 
                            onChange={e => setData('end_date', e.target.value)}
                            className={inputClasses(errors.end_date)}
                        />
                        {errors.end_date && <p className="text-red-500 text-xs mt-1 italic">{errors.end_date}</p>}
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-gray-400" /> Documentación (PDF)
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {['dni', 'convenio', 'seguro'].map((doc) => (
                        <div key={doc} className="p-4 border border-gray-200 rounded-xl bg-gray-50/30 overflow-hidden">
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                                {doc === 'dni' ? 'DNI Escaneado' : doc === 'convenio' ? 'Convenio de Prácticas' : 'Seguro'}
                            </label>
                            <input 
                                type="file" 
                                accept={doc === 'dni' ? ".pdf,.jpg,.jpeg,.png" : ".pdf"}
                                onChange={e => setData(`document_${doc}` as any, e.target.files ? e.target.files[0] : null)}
                                className="block w-full text-xs text-gray-500
                                    file:mr-3 file:py-2 file:px-4
                                    file:rounded-lg file:border-0
                                    file:text-xs file:font-bold
                                    file:bg-gray-100 file:text-gray-700
                                    hover:file:bg-gray-200 transition-all
                                    cursor-pointer"
                            />
                            {errors[`document_${doc}`] && <p className="text-red-500 text-[10px] mt-2 italic font-medium">{errors[`document_${doc}`]}</p>}
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex items-center justify-end gap-4">
                <InertiaLink
                    href="/becarios"
                    className="px-6 py-3 text-sm font-bold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-all shadow-sm"
                >
                    Cancelar
                </InertiaLink>

                <button 
                    type="submit" 
                    disabled={processing}
                    className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >                   
                    {processing ? 'Procesando...' : submitText}
                </button>
            </div>
        </div>
    );
}