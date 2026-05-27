import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    Check,
    ChevronsUpDown,
    Download,
    FileDown,
    FileSpreadsheet,
    Save,
    Trash2,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';

interface ReportDefinition {
    label: string;
    fields: Record<string, string>;
}

interface Template {
    id: number;
    name: string;
    report_type: string;
    fields: string[];
    filters?: Record<string, string>;
    group_by?: string | null;
}

interface Option {
    id: number;
    name: string;
    user_id?: number | null;
}

interface SelectedConfig {
    report_type: string;
    fields: string[];
    filters: Record<string, string>;
    group_by?: string | null;
}

interface Preview {
    headings: string[];
    rows: PreviewRow[];
    total: number;
    limited: boolean;
}

type PreviewRow =
    | Record<string, string>
    | {
          __group: true;
          __label: string;
          __count: number;
      };

interface Props {
    definitions: Record<string, ReportDefinition>;
    selected: SelectedConfig;
    templates: Template[];
    centers: Option[];
    interns: Option[];
    preview: Preview;
}

const statusOptions = [
    { value: 'active', label: 'Activo' },
    { value: 'finished', label: 'Finalizado' },
    { value: 'abandoned', label: 'Abandonado' },
];

const taskStatusOptions = [
    { value: 'pending', label: 'Pendiente' },
    { value: 'in_progress', label: 'En progreso' },
    { value: 'in_review', label: 'En revision' },
    { value: 'completed', label: 'Completada' },
    { value: 'rejected', label: 'Rechazada' },
];

const priorityOptions = [
    { value: 'low', label: 'Baja' },
    { value: 'medium', label: 'Media' },
    { value: 'high', label: 'Alta' },
];

const evaluationTypeOptions = [
    { value: 'weekly', label: 'Semanal' },
    { value: 'monthly', label: 'Mensual' },
    { value: 'final', label: 'Final' },
];

const previewRowsPerPage = 20;

export default function ReportsIndex({
    definitions,
    selected,
    templates,
    centers,
    interns,
    preview,
}: Props) {
    const [reportType, setReportType] = useState(selected.report_type);
    const [fields, setFields] = useState(selected.fields);
    const [filters, setFilters] = useState<Record<string, string>>(
        selected.filters ?? {},
    );
    const [groupBy, setGroupBy] = useState(selected.group_by ?? '');
    const [templateName, setTemplateName] = useState('');
    const [previewPage, setPreviewPage] = useState(1);

    const definition = definitions[reportType];
    const fieldEntries = Object.entries(definition.fields);
    const exportQuery = useMemo(
        () =>
            buildQuery({
                report_type: reportType,
                fields,
                filters,
                group_by: groupBy,
            }),
        [fields, filters, groupBy, reportType],
    );
    const totalPreviewPages = Math.max(
        1,
        Math.ceil(preview.rows.length / previewRowsPerPage),
    );
    const currentPreviewPage = Math.min(previewPage, totalPreviewPages);
    const previewRangeStart =
        preview.rows.length > 0
            ? (currentPreviewPage - 1) * previewRowsPerPage + 1
            : 0;
    const previewRangeEnd = Math.min(
        currentPreviewPage * previewRowsPerPage,
        preview.rows.length,
    );
    const paginatedPreviewRows = preview.rows.slice(
        (currentPreviewPage - 1) * previewRowsPerPage,
        currentPreviewPage * previewRowsPerPage,
    );

    const changeReportType = (type: string) => {
        const nextFields = Object.keys(definitions[type].fields).slice(0, 5);

        setReportType(type);
        setFields(nextFields);
        setFilters({});
        setGroupBy('');
        setPreviewPage(1);
    };

    const toggleField = (field: string) => {
        setFields((current) => {
            if (current.includes(field)) {
                return current.length === 1
                    ? current
                    : current.filter((item) => item !== field);
            }

            return [...current, field];
        });
    };

    const updateFilter = (key: string, value: string) => {
        setFilters((current) => {
            const next = { ...current };

            if (!value) {
                delete next[key];
            } else {
                next[key] = value;
            }

            return next;
        });
    };

    const previewReport = () => {
        router.get(
            '/reportes',
            buildQueryObject({
                report_type: reportType,
                fields,
                filters,
                group_by: groupBy,
            }),
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
        setPreviewPage(1);
    };

    const saveTemplate = (event: React.FormEvent) => {
        event.preventDefault();

        router.post(
            '/reportes/plantillas',
            {
                name: templateName,
                report_type: reportType,
                fields,
                filters,
                group_by: groupBy || null,
            },
            {
                preserveScroll: true,
                onSuccess: () => setTemplateName(''),
            },
        );
    };

    const applyTemplate = (template: Template) => {
        setReportType(template.report_type);
        setFields(template.fields);
        setFilters(template.filters ?? {});
        setGroupBy(template.group_by ?? '');
        setPreviewPage(1);

        router.get(
            '/reportes',
            buildQueryObject({
                report_type: template.report_type,
                fields: template.fields,
                filters: template.filters ?? {},
                group_by: template.group_by ?? '',
            }),
            { preserveScroll: true },
        );
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/dashboard' },
                { title: 'Reportes', href: '/reportes' },
            ]}
        >
            <Head title="Reportes" />

            <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-8">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                    <div>
                        <Link
                            href="/dashboard"
                            className="mb-2 inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-slate-900"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Volver al dashboard
                        </Link>
                        <h1 className="text-2xl font-bold text-slate-900">
                            Reportes
                        </h1>
                        
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <a
                            href={`/reportes/exportar?${exportQuery}&format=xlsx`}
                            className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700"
                        >
                            <FileSpreadsheet className="h-4 w-4" />
                            Excel
                        </a>
                        <a
                            href={`/reportes/exportar?${exportQuery}&format=pdf`}
                            className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800"
                        >
                            <FileDown className="h-4 w-4" />
                            PDF
                        </a>
                    </div>
                </div>

                <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[320px_minmax(0,1fr)] 2xl:grid-cols-[340px_minmax(0,1fr)]">
                    <div className="space-y-5">
                        <Card className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                            <h2 className="text-lg font-black text-slate-900">
                                Constructor
                            </h2>
                            <div className="mt-4 space-y-4">
                                <SelectField
                                    label="Origen de datos"
                                    value={reportType}
                                    onChange={changeReportType}
                                >
                                    {Object.entries(definitions).map(
                                        ([key, item]) => (
                                            <option key={key} value={key}>
                                                {item.label}
                                            </option>
                                        ),
                                    )}
                                </SelectField>

                                <div className="space-y-2">
                                    <Label className="text-[11px] font-black text-slate-400 uppercase">
                                        Campos
                                    </Label>
                                    <div className="grid grid-cols-1 gap-2">
                                        {fieldEntries.map(([key, label]) => (
                                            <label
                                                key={key}
                                                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700"
                                            >
                                                <Checkbox
                                                    checked={fields.includes(
                                                        key,
                                                    )}
                                                    onCheckedChange={() =>
                                                        toggleField(key)
                                                    }
                                                />
                                                {label}
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <SelectField
                                    label="Agrupar por"
                                    value={groupBy}
                                    onChange={setGroupBy}
                                >
                                    <option value="">Sin agrupacion</option>
                                    {fieldEntries.map(([key, label]) => (
                                        <option key={key} value={key}>
                                            {label}
                                        </option>
                                    ))}
                                </SelectField>
                            </div>
                        </Card>

                        <Card className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                            <h2 className="text-lg font-black text-slate-900">
                                Filtros
                            </h2>
                            <div className="mt-4 space-y-4">
                                <SelectField
                                    label="Centro"
                                    value={filters.center_id ?? ''}
                                    onChange={(value) =>
                                        updateFilter('center_id', value)
                                    }
                                >
                                    <option value="">Todos los centros</option>
                                    {centers.map((center) => (
                                        <option
                                            key={center.id}
                                            value={center.id}
                                        >
                                            {center.name}
                                        </option>
                                    ))}
                                </SelectField>

                                <SearchableSelectField
                                    label="Becario"
                                    value={
                                        filters.intern_id ??
                                        filters.intern_user_id ??
                                        ''
                                    }
                                    onChange={(value) =>
                                        updateFilter(
                                            reportType === 'evaluations'
                                                ? 'intern_user_id'
                                                : 'intern_id',
                                            value,
                                        )
                                    }
                                    placeholder="Todos los becarios"
                                    options={interns
                                        .map((intern) => ({
                                            label: intern.name,
                                            value:
                                                reportType === 'evaluations'
                                                    ? String(
                                                          intern.user_id ?? '',
                                                      )
                                                    : String(intern.id),
                                        }))
                                        .filter((option) => option.value)}
                                />

                                {reportType === 'interns' && (
                                    <SelectField
                                        label="Estado"
                                        value={filters.status ?? ''}
                                        onChange={(value) =>
                                            updateFilter('status', value)
                                        }
                                    >
                                        <option value="">Todos</option>
                                        {statusOptions.map((option) => (
                                            <option
                                                key={option.value}
                                                value={option.value}
                                            >
                                                {option.label}
                                            </option>
                                        ))}
                                    </SelectField>
                                )}

                                {reportType === 'tasks' && (
                                    <>
                                        <SelectField
                                            label="Estado de tarea"
                                            value={filters.task_status ?? ''}
                                            onChange={(value) =>
                                                updateFilter(
                                                    'task_status',
                                                    value,
                                                )
                                            }
                                        >
                                            <option value="">Todos</option>
                                            {taskStatusOptions.map((option) => (
                                                <option
                                                    key={option.value}
                                                    value={option.value}
                                                >
                                                    {option.label}
                                                </option>
                                            ))}
                                        </SelectField>
                                        <SelectField
                                            label="Prioridad"
                                            value={filters.priority ?? ''}
                                            onChange={(value) =>
                                                updateFilter('priority', value)
                                            }
                                        >
                                            <option value="">Todas</option>
                                            {priorityOptions.map((option) => (
                                                <option
                                                    key={option.value}
                                                    value={option.value}
                                                >
                                                    {option.label}
                                                </option>
                                            ))}
                                        </SelectField>
                                    </>
                                )}

                                {reportType === 'evaluations' && (
                                    <SelectField
                                        label="Tipo de evaluacion"
                                        value={filters.evaluation_type ?? ''}
                                        onChange={(value) =>
                                            updateFilter(
                                                'evaluation_type',
                                                value,
                                            )
                                        }
                                    >
                                        <option value="">Todas</option>
                                        {evaluationTypeOptions.map((option) => (
                                            <option
                                                key={option.value}
                                                value={option.value}
                                            >
                                                {option.label}
                                            </option>
                                        ))}
                                    </SelectField>
                                )}

                                <Button
                                    type="button"
                                    onClick={previewReport}
                                    className="h-10 w-full rounded-xl font-bold"
                                >
                                    <Download className="h-4 w-4" />
                                    Generar vista previa
                                </Button>
                            </div>
                        </Card>

                        <Card className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                            <h2 className="text-lg font-black text-slate-900">
                                Plantillas
                            </h2>
                            <form
                                onSubmit={saveTemplate}
                                className="mt-4 flex gap-2"
                            >
                                <Input
                                    value={templateName}
                                    onChange={(event) =>
                                        setTemplateName(event.target.value)
                                    }
                                    placeholder="Nombre de plantilla"
                                    className="h-10 rounded-xl border-slate-200"
                                />
                                <Button
                                    type="submit"
                                    disabled={!templateName.trim()}
                                    className="h-10 rounded-xl font-bold"
                                >
                                    <Save className="h-4 w-4" />
                                </Button>
                            </form>

                            <div className="mt-4 max-h-72 space-y-2 overflow-y-auto pr-1">
                                {templates.length === 0 ? (
                                    <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-500">
                                        Todavia no hay plantillas guardadas.
                                    </p>
                                ) : (
                                    templates.map((template) => (
                                        <div
                                            key={template.id}
                                            className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-2xl border border-slate-200 p-3"
                                        >
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    applyTemplate(template)
                                                }
                                                className="min-w-0 text-left"
                                            >
                                                <p className="truncate text-sm font-black text-slate-900">
                                                    {template.name}
                                                </p>
                                                <p className="mt-1 text-xs font-bold text-slate-400 uppercase">
                                                    {definitions[
                                                        template.report_type
                                                    ]?.label ??
                                                        template.report_type}
                                                </p>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    router.delete(
                                                        `/reportes/plantillas/${template.id}`,
                                                        {
                                                            preserveScroll: true,
                                                        },
                                                    )
                                                }
                                                className="rounded-xl bg-red-50 p-2 text-red-600 transition hover:bg-red-100"
                                                aria-label={`Eliminar plantilla ${template.name}`}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </Card>
                    </div>

                    <Card className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-center">
                            <div>
                                <h2 className="text-lg font-black text-slate-900">
                                    Vista previa
                                </h2>
                                <p className="text-sm text-slate-500">
                                    {preview.total} resultado(s)
                                </p>
                            </div>
                            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700 uppercase">
                                {definition.label}
                            </span>
                        </div>

                        {preview.rows.length === 0 ? (
                            <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-center text-sm font-semibold text-slate-500">
                                No hay datos para los filtros seleccionados.
                            </div>
                        ) : (
                            <div className="overflow-hidden rounded-2xl border border-slate-200">
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[720px] text-sm">
                                        <thead className="bg-slate-50 text-left text-[11px] font-black text-slate-400 uppercase">
                                            <tr>
                                                {preview.headings.map(
                                                    (heading) => (
                                                        <th
                                                            key={heading}
                                                            className="px-4 py-3"
                                                        >
                                                            {heading}
                                                        </th>
                                                    ),
                                                )}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {paginatedPreviewRows.map(
                                                (row, index) => {
                                                    if (isGroupRow(row)) {
                                                        return (
                                                            <tr
                                                                key={`group-${index}-${row.__label}`}
                                                                className="bg-blue-50/80 text-blue-800"
                                                            >
                                                                <td
                                                                    colSpan={
                                                                        preview
                                                                            .headings
                                                                            .length
                                                                    }
                                                                    className="px-4 py-2 text-xs font-black uppercase"
                                                                >
                                                                    {
                                                                        row.__label
                                                                    }{' '}
                                                                    <span className="font-bold text-blue-500">
                                                                        (
                                                                        {
                                                                            row.__count
                                                                        }
                                                                        )
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        );
                                                    }

                                                    return (
                                                        <tr
                                                            key={index}
                                                            className="h-16 text-slate-700"
                                                        >
                                                            {Object.values(
                                                                row,
                                                            ).map(
                                                                (
                                                                    value,
                                                                    cellIndex,
                                                                ) => (
                                                                    <td
                                                                        key={`${index}-${cellIndex}`}
                                                                        className="h-16 px-4 py-2 align-middle"
                                                                    >
                                                                        <span className="line-clamp-2 min-h-10 leading-5">
                                                                            {value ||
                                                                                '-'}
                                                                        </span>
                                                                    </td>
                                                                ),
                                                            )}
                                                        </tr>
                                                    );
                                                },
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-100 bg-slate-50/70 px-4 py-3 md:flex-row">
                                    <p className="rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-slate-500 shadow-sm ring-1 ring-slate-100">
                                        Mostrando{' '}
                                        <span className="font-black text-slate-900">
                                            {previewRangeStart}-
                                            {previewRangeEnd}
                                        </span>{' '}
                                        de{' '}
                                        <span className="font-black text-slate-900">
                                            {preview.rows.length}
                                        </span>{' '}
                                        resultados · Pagina{' '}
                                        <span className="font-black text-slate-900">
                                            {currentPreviewPage}
                                        </span>{' '}
                                        de{' '}
                                        <span className="font-black text-slate-900">
                                            {totalPreviewPages}
                                        </span>
                                    </p>

                                    {totalPreviewPages > 1 && (
                                        <div className="inline-flex overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                                            <button
                                                type="button"
                                                disabled={
                                                    currentPreviewPage === 1
                                                }
                                                onClick={() =>
                                                    setPreviewPage((page) =>
                                                        Math.max(1, page - 1),
                                                    )
                                                }
                                                className="cursor-pointer border-r border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                                            >
                                                Anterior
                                            </button>
                                            <button
                                                type="button"
                                                disabled={
                                                    currentPreviewPage ===
                                                    totalPreviewPages
                                                }
                                                onClick={() =>
                                                    setPreviewPage((page) =>
                                                        Math.min(
                                                            totalPreviewPages,
                                                            page + 1,
                                                        ),
                                                    )
                                                }
                                                className="cursor-pointer px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                                            >
                                                Siguiente
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}

function SelectField({
    label,
    value,
    onChange,
    children,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-2">
            <Label className="text-[11px] font-black text-slate-400 uppercase">
                {label}
            </Label>
            <select
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm transition outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
            >
                {children}
            </select>
        </div>
    );
}

function SearchableSelectField({
    label,
    value,
    onChange,
    options,
    placeholder,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: { label: string; value: string }[];
    placeholder: string;
}) {
    const [open, setOpen] = useState(false);
    const selectedLabel =
        options.find((option) => option.value === value)?.label ?? placeholder;

    return (
        <div className="space-y-2">
            <Label className="text-[11px] font-black text-slate-400 uppercase">
                {label}
            </Label>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <button
                        type="button"
                        className={cn(
                            'flex h-10 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 text-left text-sm transition outline-none hover:bg-slate-50',
                            !value && 'text-slate-500',
                        )}
                    >
                        <span className="truncate">{selectedLabel}</span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-slate-400" />
                    </button>
                </PopoverTrigger>
                <PopoverContent
                    className="w-[--radix-popover-trigger-width] p-0"
                    align="start"
                >
                    <Command>
                        <CommandInput placeholder="Buscar becario..." />
                        <CommandList>
                            <CommandEmpty>No hay resultados.</CommandEmpty>
                            <CommandGroup>
                                <CommandItem
                                    value={placeholder}
                                    onSelect={() => {
                                        onChange('');
                                        setOpen(false);
                                    }}
                                    className="cursor-pointer"
                                >
                                    <Check
                                        className={cn(
                                            'mr-2 h-4 w-4',
                                            !value
                                                ? 'opacity-100'
                                                : 'opacity-0',
                                        )}
                                    />
                                    {placeholder}
                                </CommandItem>
                                {options.map((option) => (
                                    <CommandItem
                                        key={option.value}
                                        value={`${option.label} ${option.value}`}
                                        onSelect={() => {
                                            onChange(option.value);
                                            setOpen(false);
                                        }}
                                        className="cursor-pointer"
                                    >
                                        <Check
                                            className={cn(
                                                'mr-2 h-4 w-4',
                                                value === option.value
                                                    ? 'opacity-100'
                                                    : 'opacity-0',
                                            )}
                                        />
                                        <span className="truncate">
                                            {option.label}
                                        </span>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    );
}

function isGroupRow(
    row: PreviewRow,
): row is Extract<PreviewRow, { __group: true }> {
    return '__group' in row && row.__group === true;
}

function buildQueryObject(config: SelectedConfig) {
    return {
        report_type: config.report_type,
        fields: config.fields,
        filters: config.filters,
        group_by: config.group_by || undefined,
    };
}

function buildQuery(config: SelectedConfig) {
    const params = new URLSearchParams();

    params.set('report_type', config.report_type);
    config.fields.forEach((field) => params.append('fields[]', field));

    Object.entries(config.filters).forEach(([key, value]) => {
        if (value) {
            params.append(`filters[${key}]`, value);
        }
    });

    if (config.group_by) {
        params.set('group_by', config.group_by);
    }

    return params.toString();
}
