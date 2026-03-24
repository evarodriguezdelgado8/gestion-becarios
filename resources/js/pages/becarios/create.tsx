import AppLayout from '@/layouts/app-layout';
import { Head, useForm } from '@inertiajs/react';
import InternForm from './components/internForm';
import { Center, InternFormData } from '@/types';

interface Props {
    centers: Center[];
}

export default function Create({ centers }: Props) {
    const { data, setData, post, processing, errors } = useForm<InternFormData>({
        name: '',
        last_name: '',
        dni: '',
        email: '',
        phone: '',
        address: '',
        center_id: '',
        academic_cycle: '',
        academic_tutor: '',
        start_date: '',
        end_date: '',
        total_hours: 400,
        completed_hours: 0,
        status: '',
        document_dni: null,
        document_convenio: null,
    });

    const handleSubmit = (e: React.SyntheticEvent) => {
        e.preventDefault();
        console.log("¡El botón funciona! Enviando datos:", data);
        post('/becarios');
    };

    return (
        <AppLayout>
            <Head title="Nuevo Becario" />
            
            <div className="py-12">
                <div className="max-w-5xl mx-auto sm:px-6 lg:px-8">
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-gray-900">Registrar Nuevo Becario</h1>
                        <p className="text-gray-600">Completa la información para dar de alta al estudiante.</p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <InternForm 
                            data={data}
                            setData={setData}
                            errors={errors}
                            processing={processing}
                            centers={centers}
                            submitText="Crear Becario"
                        />
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}