import { Head, Link, router, useForm } from '@inertiajs/react';
import { ArrowLeft, Check, ClipboardList, Edit2, Layers3, Plus, Scale, Trash2, X } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';

import DeleteConfirmModal from '@/components/common/DeleteConfirmModal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';

type Rubric = Record<'1' | '2' | '3' | '4' | '5', string>;

interface Criterion {
    id: number;
    evaluation_category_id?: number;
    evaluation_type?: string | null;
    name: string;
    description?: string | null;
    weight: number | string;
    rubric?: Record<string, string> | string[] | null;
}

interface Category {
    id: number;
    evaluation_type?: string | null;
    name: string;
    description?: string | null;
    criteria: Criterion[];
}

const evaluationTypes = [
    { value: 'weekly', label: 'Semanal' },
    { value: 'monthly', label: 'Mensual' },
    { value: 'final', label: 'Final' },
];

const typeLabels: Record<string, string> = {
    weekly: 'Semanal',
    monthly: 'Mensual',
    final: 'Final',
};

const rubricLevels = [
    { value: '1', label: '1', placeholder: 'Insuficiente: no alcanza el nivel esperado...' },
    { value: '2', label: '2', placeholder: 'Básico: necesita mejorar en varios aspectos...' },
    { value: '3', label: '3', placeholder: 'Correcto: cumple lo esperado de forma suficiente...' },
    { value: '4', label: '4', placeholder: 'Notable: supera lo esperado con autonomía...' },
    { value: '5', label: '5', placeholder: 'Excelente: desempeño sobresaliente y constante...' },
] as const;

const categoriesPerPage = 5;

const blankRubric = (): Rubric => ({ '1': '', '2': '', '3': '', '4': '', '5': '' });

const normalizeRubric = (rubric?: Record<string, string> | string[] | null): Rubric => {
    const normalized = blankRubric();

    rubricLevels.forEach((level) => {
        normalized[level.value] = Array.isArray(rubric) ? rubric[Number(level.value)] || rubric[Number(level.value) - 1] || '' : rubric?.[level.value] || '';
    });

    return normalized;
};

const getCriterionType = (criterion: Criterion) => criterion.evaluation_type || 'weekly';
const getCategoryType = (category: Category) => category.evaluation_type || 'weekly';

const getRubricEntries = (rubric?: Record<string, string> | string[] | null) =>
    rubricLevels
        .map((level) => ({
            ...level,
            text: normalizeRubric(rubric)[level.value],
        }))
        .filter((entry) => entry.text);

export default function Config({ categories }: { categories: Category[] }) {
    const [editingCriterionId, setEditingCriterionId] = useState<number | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<{ type: 'category' | 'criterion'; id: number; name: string } | null>(null);
    const [categoryTypeFilter, setCategoryTypeFilter] = useState('all');
    const [categoriesPage, setCategoriesPage] = useState(1);
    const [managedCategoryId, setManagedCategoryId] = useState<number | null>(null);

    const categoryForm = useForm({
        name: '',
        description: '',
        evaluation_type: 'weekly',
    });

    const categoryEditForm = useForm({
        name: '',
        description: '',
        evaluation_type: 'weekly',
    });

    const criterionForm = useForm({
        evaluation_category_id: '',
        evaluation_type: 'weekly',
        name: '',
        description: '',
        weight: '',
        rubric: blankRubric(),
    });

    const criterionEditForm = useForm({
        evaluation_category_id: '',
        evaluation_type: 'weekly',
        name: '',
        description: '',
        weight: '',
        rubric: blankRubric(),
    });

    const submitCategory = (event: React.FormEvent) => {
        event.preventDefault();
        categoryForm.post('/evaluaciones/categorias', {
            preserveScroll: true,
            onSuccess: () => categoryForm.reset(),
        });
    };

    const submitCriterion = (event: React.FormEvent) => {
        event.preventDefault();
        criterionForm.post('/evaluaciones/criterios', {
            preserveScroll: true,
            onSuccess: () => criterionForm.reset(),
        });
    };

    const openCategoryManager = (category: Category) => {
        setEditingCriterionId(null);
        setManagedCategoryId(category.id);
        categoryEditForm.setData({
            name: category.name,
            description: category.description ?? '',
            evaluation_type: getCategoryType(category),
        });
    };

    const closeCategoryManager = () => {
        setManagedCategoryId(null);
        setEditingCriterionId(null);
    };

    const submitCategoryEdit = (event: React.FormEvent, categoryId: number) => {
        event.preventDefault();
        categoryEditForm.put(`/evaluaciones/categorias/${categoryId}`, {
            preserveScroll: true,
        });
    };

    const startEditCriterion = (criterion: Criterion, categoryId: number) => {
        setEditingCriterionId(criterion.id);
        criterionEditForm.setData({
            evaluation_category_id: String(criterion.evaluation_category_id ?? categoryId),
            evaluation_type: getCriterionType(criterion),
            name: criterion.name,
            description: criterion.description ?? '',
            weight: String(criterion.weight),
            rubric: normalizeRubric(criterion.rubric),
        });
    };

    const submitCriterionEdit = (event: React.FormEvent, criterionId: number) => {
        event.preventDefault();
        criterionEditForm.put(`/evaluaciones/criterios/${criterionId}`, {
            preserveScroll: true,
            onSuccess: () => setEditingCriterionId(null),
        });
    };

    const updateCreateRubric = (level: keyof Rubric, value: string) => {
        criterionForm.setData('rubric', { ...criterionForm.data.rubric, [level]: value });
    };

    const updateEditRubric = (level: keyof Rubric, value: string) => {
        criterionEditForm.setData('rubric', { ...criterionEditForm.data.rubric, [level]: value });
    };

    const confirmDelete = () => {
        if (!deleteTarget) return;

        const url =
            deleteTarget.type === 'category'
                ? `/evaluaciones/categorias/${deleteTarget.id}`
                : `/evaluaciones/criterios/${deleteTarget.id}`;

        router.delete(url, {
            preserveScroll: true,
            onSuccess: () => {
                if (deleteTarget.type === 'category') {
                    setManagedCategoryId(null);
                }

                setDeleteTarget(null);
                setEditingCriterionId(null);
            },
        });
    };

    const criteriaCount = categories.reduce((total, category) => total + category.criteria.length, 0);
    const categoriesByType = evaluationTypes.map((type) => ({
        ...type,
        count: categories.filter((category) => getCategoryType(category) === type.value).length,
    }));
    const filteredCategories = useMemo(
        () => (categoryTypeFilter === 'all' ? categories : categories.filter((category) => getCategoryType(category) === categoryTypeFilter)),
        [categories, categoryTypeFilter],
    );
    const totalCategoryPages = Math.max(1, Math.ceil(filteredCategories.length / categoriesPerPage));
    const currentCategoryPage = Math.min(categoriesPage, totalCategoryPages);
    const paginatedCategories = filteredCategories.slice((currentCategoryPage - 1) * categoriesPerPage, currentCategoryPage * categoriesPerPage);
    const managedCategory = categories.find((category) => category.id === managedCategoryId);

    useEffect(() => {
        if (!managedCategory) return;

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                closeCategoryManager();
            }
        };

        window.addEventListener('keydown', handleEscape);

        return () => window.removeEventListener('keydown', handleEscape);
    }, [managedCategory]);

    return (
        <AppLayout breadcrumbs={[{ title: 'Evaluación y Notas', href: '/evaluaciones' }, { title: 'Configuración', href: '/evaluaciones/configuracion' }]}>
            <Head title="Configuración de Evaluación" />

            <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-8">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div>
                        <Link href="/evaluaciones" className="mb-2 inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-slate-900">
                            <ArrowLeft className="h-4 w-4" />
                            Volver al panel
                        </Link>
                        <h1 className="text-2xl font-bold text-slate-900">Configuración de criterios</h1>
                    </div>

                    
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <SummaryCard label="Categorías" value={categories.length} icon={<Layers3 className="h-5 w-5" />} iconClass="bg-blue-50 text-blue-600" />
                    <SummaryCard label="Criterios" value={criteriaCount} icon={<ClipboardList className="h-5 w-5" />} iconClass="bg-emerald-50 text-emerald-600" />
                    <Card className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[11px] font-black uppercase text-slate-400">Categorias por tipo</p>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {categoriesByType.map((type) => (
                                        <span
                                            key={type.value}
                                            className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-700"
                                        >
                                            {type.label}: {type.count}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                                <Scale className="h-5 w-5" />
                            </div>
                        </div>
                    </Card>
                </div>

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
                    <div className="space-y-6">
                        <CategoryCreateCard form={categoryForm} onSubmit={submitCategory} />
                        <CriterionFormCard
                            categories={categories}
                            form={criterionForm}
                            onSubmit={submitCriterion}
                            updateRubric={updateCreateRubric}
                            submitLabel="Añadir criterio"
                        />
                    </div>

                    <Card className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                            <div>
                                <h2 className="text-lg font-black text-slate-900">Competencias configuradas</h2>
                                <p className="text-sm text-slate-500">Cada competencia puede sumar hasta 100% con sus criterios.</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {[{ value: 'all', label: 'Todas' }, ...evaluationTypes].map((type) => {
                                    const isActive = categoryTypeFilter === type.value;

                                    return (
                                        <button
                                            key={type.value}
                                            type="button"
                                            onClick={() => {
                                                setCategoryTypeFilter(type.value);
                                                setCategoriesPage(1);
                                            }}
                                            className={`rounded-xl px-3 py-2 text-xs font-black transition ${
                                                isActive
                                                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                                                    : 'border border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-blue-700'
                                            }`}
                                        >
                                            {type.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {filteredCategories.length === 0 ? (
                            <div className="flex min-h-[280px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50/70 p-8 text-center">
                                <ClipboardList className="mb-3 h-7 w-7 text-slate-300" />
                                <p className="font-black text-slate-800">Todavía no hay competencias</p>
                                <p className="mt-1 text-sm text-slate-500">Crea una categoría o cambia el filtro para ver otras competencias.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {paginatedCategories.map((category) => {
                                    const categoryWeight = category.criteria.reduce((sum, criterion) => sum + Number(criterion.weight), 0);
                                    return (
                                        <div key={category.id} className="overflow-hidden rounded-2xl border border-slate-200">
                                            <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
                                                    <div className="flex items-center justify-between gap-3">
                                                        <div>
                                                            <p className="font-black text-slate-900">{category.name}</p>
                                                            <span className="mt-1 inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-black uppercase text-blue-700">
                                                                {typeLabels[getCategoryType(category)]}
                                                            </span>
                                                            {category.description && <p className="mt-1 text-sm text-slate-500">{category.description}</p>}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600 shadow-sm">{categoryWeight}%</span>
                                                            <button type="button" onClick={() => openCategoryManager(category)} className="rounded-xl bg-blue-50 p-2 text-blue-600 transition hover:bg-blue-100 hover:text-blue-700" title="Editar categoría" aria-label={`Editar categoría ${category.name}`}>
                                                                <Edit2 className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => setDeleteTarget({ type: 'category', id: category.id, name: category.name })}
                                                                className="rounded-xl bg-rose-50 p-2 text-red-600 transition hover:bg-red-100 hover:text-red-700"
                                                                title="Eliminar categoría"
                                                                aria-label={`Eliminar categoría ${category.name}`}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                            </div>

                                            {category.criteria.length === 0 ? (
                                                <div className="px-4 py-4 text-sm font-semibold text-slate-400">Sin criterios en esta categoría.</div>
                                            ) : (
                                                <div className="divide-y divide-slate-100">
                                                    {category.criteria.map((criterion) => (
                                                            <div key={criterion.id} className="px-4 py-3">
                                                                <div className="min-w-0">
                                                                    <div className="flex flex-wrap items-center gap-2">
                                                                        <p className="font-bold text-slate-800">{criterion.name}</p>
                                                                        <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-slate-600 shadow-sm">
                                                                            {criterion.weight}%
                                                                        </span>
                                                                    </div>
                                                                    {criterion.description && <p className="mt-1 text-sm text-slate-500">{criterion.description}</p>}
                                                                    {getRubricEntries(criterion.rubric).length > 0 && (
                                                                        <div className="mt-3 grid gap-2 md:grid-cols-2">
                                                                            {getRubricEntries(criterion.rubric).map((entry) => (
                                                                                <div key={entry.value} className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
                                                                                    <span className="font-black text-blue-700">{entry.label}/5</span>
                                                                                    <span className="ml-2">{entry.text}</span>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                                {totalCategoryPages > 1 && (
                                    <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-100 bg-slate-50/70 px-4 py-4 text-sm md:flex-row">
                                        <p className="rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-slate-500 shadow-sm ring-1 ring-slate-100">
                                            Pagina {currentCategoryPage} de {totalCategoryPages}
                                        </p>
                                        <div className="inline-flex overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                                            <button
                                                type="button"
                                                onClick={() => setCategoriesPage((page) => Math.max(1, page - 1))}
                                                disabled={currentCategoryPage === 1}
                                                className="cursor-pointer border-r border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                                            >
                                                Anterior
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setCategoriesPage((page) => Math.min(totalCategoryPages, page + 1))}
                                                disabled={currentCategoryPage === totalCategoryPages}
                                                className="cursor-pointer px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                                            >
                                                Siguiente
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </Card>
                </div>
            </div>

            <DeleteConfirmModal
                isOpen={Boolean(deleteTarget)}
                onClose={() => setDeleteTarget(null)}
                onConfirm={confirmDelete}
                title={deleteTarget?.type === 'category' ? '¿Eliminar categoría?' : '¿Eliminar criterio?'}
                itemName={deleteTarget?.name}
            />

            {managedCategory && (
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="category-manager-title"
                        className="max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
                    >
                        <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-slate-50 px-6 py-5">
                            <div>
                                <p className="text-[11px] font-black uppercase text-slate-400">Gestionar categoria</p>
                                <h2 id="category-manager-title" className="mt-1 text-xl font-black text-slate-900">{managedCategory.name}</h2>
                                <p className="mt-1 text-sm text-slate-500">Edita la categoria y administra sus criterios desde aqui.</p>
                            </div>
                            <button
                                type="button"
                                onClick={closeCategoryManager}
                                className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 transition hover:text-slate-900"
                                aria-label="Cerrar modal"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="max-h-[calc(90vh-92px)] space-y-6 overflow-y-auto p-6">
                            <form onSubmit={(event) => submitCategoryEdit(event, managedCategory.id)} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label className="text-[11px] font-black uppercase text-slate-400">Nombre</Label>
                                        <Input
                                            value={categoryEditForm.data.name}
                                            onChange={(event) => categoryEditForm.setData('name', event.target.value)}
                                            className="h-10 rounded-xl border-slate-200 bg-white"
                                        />
                                    </div>
                                    <SelectField label="Tipo de evaluacion" value={categoryEditForm.data.evaluation_type} onChange={(value) => categoryEditForm.setData('evaluation_type', value)}>
                                        {evaluationTypes.map((type) => (
                                            <option key={type.value} value={type.value}>
                                                {type.label}
                                            </option>
                                        ))}
                                    </SelectField>
                                </div>
                                <div className="mt-4 space-y-2">
                                    <Label className="text-[11px] font-black uppercase text-slate-400">Descripcion</Label>
                                    <textarea
                                        value={categoryEditForm.data.description}
                                        onChange={(event) => categoryEditForm.setData('description', event.target.value)}
                                        className="min-h-20 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                                        placeholder="Opcional"
                                    />
                                </div>
                                <div className="mt-4 flex justify-end">
                                    <Button type="submit" disabled={categoryEditForm.processing} className="h-10 rounded-xl font-bold">
                                        <Check className="h-4 w-4" />
                                        Guardar categoria
                                    </Button>
                                </div>
                            </form>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <h3 className="font-black text-slate-900">Criterios de la categoría</h3>
                                        <p className="text-sm text-slate-500">Puedes editar o borrar criterios.</p>
                                    </div>
                                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                                        {managedCategory.criteria.reduce((sum, criterion) => sum + Number(criterion.weight), 0)}% / 100%
                                    </span>
                                </div>

                                {managedCategory.criteria.length === 0 ? (
                                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm font-semibold text-slate-400">
                                        Esta competencia todavia no tiene criterios.
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200">
                                        {managedCategory.criteria.map((criterion) =>
                                            editingCriterionId === criterion.id ? (
                                                <div key={criterion.id} className="bg-slate-50/70 p-4">
                                                    <CriterionFormCard
                                                        categories={categories}
                                                        form={criterionEditForm}
                                                        onSubmit={(event) => submitCriterionEdit(event, criterion.id)}
                                                        updateRubric={updateEditRubric}
                                                        submitLabel="Guardar cambios"
                                                        onCancel={() => setEditingCriterionId(null)}
                                                        editingCriterionId={editingCriterionId}
                                                        compact
                                                    />
                                                </div>
                                            ) : (
                                                <div key={criterion.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 px-4 py-3">
                                                    <div className="min-w-0">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <p className="font-bold text-slate-800">{criterion.name}</p>
                                                            <span className="rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-black text-slate-600">
                                                                {criterion.weight}%
                                                            </span>
                                                        </div>
                                                        {criterion.description && <p className="mt-1 text-sm text-slate-500">{criterion.description}</p>}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => startEditCriterion(criterion, managedCategory.id)}
                                                            className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                                                            title="Editar criterio"
                                                            aria-label={`Editar criterio ${criterion.name}`}
                                                        >
                                                            <Edit2 className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setDeleteTarget({ type: 'criterion', id: criterion.id, name: criterion.name })}
                                                            className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                                                            title="Eliminar criterio"
                                                            aria-label={`Eliminar criterio ${criterion.name}`}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ),
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}

function SummaryCard({ label, value, icon, iconClass }: { label: string; value: number; icon: React.ReactNode; iconClass: string }) {
    return (
        <Card className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-[11px] font-black uppercase text-slate-400">{label}</p>
                    <p className="mt-2 text-3xl font-black text-slate-900">{value}</p>
                </div>
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${iconClass}`}>{icon}</div>
            </div>
        </Card>
    );
}

function CategoryCreateCard({ form, onSubmit }: { form: ReturnType<typeof useForm<{ name: string; description: string; evaluation_type: string }>>; onSubmit: (event: React.FormEvent) => void }) {
    return (
        <Card className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-slate-900">Nueva categoría</h2>
            <p className="mt-1 text-sm text-slate-500">Agrupa criterios por área de desempeño.</p>

            <form onSubmit={onSubmit} className="mt-5 space-y-4">
                <SelectField label="Tipo de evaluacion" value={form.data.evaluation_type} onChange={(value) => form.setData('evaluation_type', value)}>
                    {evaluationTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                            {type.label}
                        </option>
                    ))}
                </SelectField>

                <div className="space-y-2">
                    <Label htmlFor="category-name" className="text-[11px] font-black uppercase text-slate-400">
                        Nombre
                    </Label>
                    <Input
                        id="category-name"
                        value={form.data.name}
                        onChange={(event) => form.setData('name', event.target.value)}
                        placeholder="Ej: Competencias técnicas"
                        className="h-10 rounded-xl border-slate-200"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="category-description" className="text-[11px] font-black uppercase text-slate-400">
                        Descripción
                    </Label>
                    <textarea
                        id="category-description"
                        value={form.data.description}
                        onChange={(event) => form.setData('description', event.target.value)}
                        className="min-h-20 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                        placeholder="Opcional"
                    />
                </div>

                <Button type="submit" disabled={form.processing} className="h-10 w-full rounded-xl font-bold">
                    <Plus className="h-4 w-4" />
                    Guardar categoría
                </Button>
            </form>
        </Card>
    );
}

function CriterionFormCard({
    categories,
    form,
    onSubmit,
    updateRubric,
    submitLabel,
    onCancel,
    editingCriterionId,
    compact = false,
}: {
    categories: Category[];
    form: ReturnType<
        typeof useForm<{
            evaluation_category_id: string;
            evaluation_type: string;
            name: string;
            description: string;
            weight: string;
            rubric: Rubric;
        }>
    >;
    onSubmit: (event: React.FormEvent) => void;
    updateRubric: (level: keyof Rubric, value: string) => void;
    submitLabel: string;
    onCancel?: () => void;
    editingCriterionId?: number | null;
    compact?: boolean;
}) {
    const availableCategories = categories.filter((category) => getCategoryType(category) === form.data.evaluation_type);
    const selectedCategory = availableCategories.find((category) => String(category.id) === form.data.evaluation_category_id);
    const currentWeight = selectedCategory?.criteria.reduce((sum, criterion) => {
        if (editingCriterionId === criterion.id) {
            return sum;
        }

        return sum + Number(criterion.weight);
    }, 0) ?? 0;
    const projectedWeight = currentWeight + Number(form.data.weight || 0);

    const content = (
        <>
            {!compact && (
                <>
                    <h2 className="text-lg font-black text-slate-900">Nuevo criterio</h2>
                    <p className="mt-1 text-sm text-slate-500">Asigna un tipo, peso y rúbrica para la nota final.</p>
                </>
            )}

            <form onSubmit={onSubmit} className="mt-5 space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <SelectField label="Tipo de evaluacion" value={form.data.evaluation_type} onChange={(value) => form.setData((current) => ({ ...current, evaluation_type: value, evaluation_category_id: '' }))}>
                        {evaluationTypes.map((type) => (
                            <option key={type.value} value={type.value}>
                                {type.label}
                            </option>
                        ))}
                    </SelectField>

                    <SelectField label="Categoría" value={form.data.evaluation_category_id} onChange={(value) => form.setData('evaluation_category_id', value)}>
                        <option value="">Seleccionar categoría</option>
                        {availableCategories.map((category) => (
                            <option key={category.id} value={category.id}>
                                {category.name}
                            </option>
                        ))}
                    </SelectField>
                </div>

                {selectedCategory && (
                    <div className={`rounded-2xl px-3 py-2 text-xs font-black ${projectedWeight <= 100 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                        Peso de la categoria con este criterio: {projectedWeight}% / 100%
                    </div>
                )}

                <div className="space-y-2">
                    <Label className="text-[11px] font-black uppercase text-slate-400">Nombre</Label>
                    <Input value={form.data.name} onChange={(event) => form.setData('name', event.target.value)} placeholder="Ej: Puntualidad" className="h-10 rounded-xl border-slate-200" />
                </div>

                <div className="space-y-2">
                    <Label className="text-[11px] font-black uppercase text-slate-400">Descripción</Label>
                    <textarea
                        value={form.data.description}
                        onChange={(event) => form.setData('description', event.target.value)}
                        className="min-h-20 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                        placeholder="Opcional"
                    />
                </div>

                <div className="space-y-2">
                    <Label className="text-[11px] font-black uppercase text-slate-400">Peso %</Label>
                    <Input type="number" min="0" max="100" value={form.data.weight} onChange={(event) => form.setData('weight', event.target.value)} placeholder="Ej: 20" className="h-10 rounded-xl border-slate-200" />
                </div>

                <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                    <div>
                        <p className="text-[11px] font-black uppercase text-slate-400">Rúbrica</p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">Describe qué significa cada puntuación para este criterio.</p>
                    </div>

                    {rubricLevels.map((level) => (
                        <div key={level.value} className="grid grid-cols-[36px_minmax(0,1fr)] items-start gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-sm font-black text-blue-700 shadow-sm">{level.label}</div>
                            <textarea
                                value={form.data.rubric[level.value]}
                                onChange={(event) => updateRubric(level.value, event.target.value)}
                                className="min-h-16 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                                placeholder={level.placeholder}
                            />
                        </div>
                    ))}
                </div>

                <div className="flex justify-end gap-2">
                    {onCancel && (
                        <Button type="button" variant="outline" onClick={onCancel} className="h-10 rounded-xl font-bold">
                            Cancelar
                        </Button>
                    )}
                    <Button type="submit" disabled={form.processing} className="h-10 rounded-xl font-bold">
                        <Plus className="h-4 w-4" />
                        {submitLabel}
                    </Button>
                </div>
            </form>
        </>
    );

    if (compact) {
        return <div>{content}</div>;
    }

    return <Card className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">{content}</Card>;
}

function SelectField({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: React.ReactNode }) {
    return (
        <div className="space-y-2">
            <Label className="text-[11px] font-black uppercase text-slate-400">{label}</Label>
            <select
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
            >
                {children}
            </select>
        </div>
    );
}
