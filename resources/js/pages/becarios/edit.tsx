import AppLayout from '@/layouts/app-layout';
import { Head, useForm } from '@inertiajs/react';
import InternForm from './components/internForm';
import { Center, Intern, InternFormData } from '@/types';

interface Props {
    intern: Intern;
    centers: Center[];
}

export default function Edit({ intern, centers }: Props) {
    const { data, setData, post, processing, errors } = useForm<InternFormData & { _method: string }>({
        _method: 'put',
        name: intern.name || '',
        last_name: intern.last_name || '',
        dni: intern.dni || '',
        email: intern.email || '',
        phone: intern.phone || '',
        address: intern.address || '',
        center_id: intern.center_id || '',
        academic_cycle: intern.academic_cycle || '',
        academic_tutor: intern.academic_tutor || '',
        start_date: intern.start_date || '',
        end_date: intern.end_date || '',
        total_hours: intern.total_hours || 400,
        completed_hours: intern.completed_hours || 0,
        status: intern.status || 'active',
        document_dni: null,
        document_convenio: null,
    });

    const handleSubmit = (e: React.SyntheticEvent) => {
        e.preventDefault();
        post(`/becarios/${intern.id}`);
    };

    return (
        <AppLayout>
            <Head title={`Editar ${intern.name}`} />
            
            <div className="py-12">
                <div className="max-w-5xl mx-auto sm:px-6 lg:px-8">
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-gray-900">Editar Becario</h1>
                        <p className="text-gray-600">Modifica los datos del expediente de {intern.name}.</p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <InternForm 
                            data={data}
                            setData={setData}
                            errors={errors}
                            processing={processing}
                            centers={centers}
                            submitText="Guardar Cambios"
                            isEdit={true}
                        />
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}