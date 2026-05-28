<?php

namespace App\Exports;

use App\Models\Intern;
use App\Models\User;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class InternsExport implements FromQuery, ShouldAutoSize, WithHeadings, WithMapping
{
    protected $filters;

    protected ?User $user;

    public function __construct($filters = [], ?User $user = null)
    {
        $this->filters = $filters;
        $this->user = $user;
    }

    private function commaFilter(?string $value): array
    {
        if (! $value) {
            return [];
        }

        return array_values(array_filter(explode(',', $value), fn ($item) => $item !== ''));
    }

    public function query()
    {
        $query = Intern::query()
            ->with('center:id,name')
            ->when($this->user?->hasRole('tutor') && ! $this->user?->hasRole('admin'), fn ($query) => $query->where('tutor_id', $this->user->id));

        if (! empty($this->filters['search'])) {
            $search = $this->filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                    ->orWhere('last_name', 'ilike', "%{$search}%")
                    ->orWhere('dni', 'ilike', "%{$search}%")
                    ->orWhere('email', 'ilike', "%{$search}%");
            });
        }

        $centerIds = $this->commaFilter($this->filters['center_id'] ?? null);
        if ($centerIds) {
            $query->whereIn('center_id', $centerIds);
        }

        $statuses = $this->commaFilter($this->filters['status'] ?? null);
        if ($statuses) {
            $query->whereIn('status', $statuses);
        }

        if (! empty($this->filters['start_from'])) {
            $query->whereDate('start_date', '>=', $this->filters['start_from']);
        }
        if (! empty($this->filters['start_to'])) {
            $query->whereDate('start_date', '<=', $this->filters['start_to']);
        }
        if (! empty($this->filters['end_from'])) {
            $query->whereDate('end_date', '>=', $this->filters['end_from']);
        }
        if (! empty($this->filters['end_to'])) {
            $query->whereDate('end_date', '<=', $this->filters['end_to']);
        }

        return $query->latest();
    }

    public function headings(): array
    {
        return ['ID', 'Nombre', 'Apellidos', 'DNI', 'Email', 'Centro', 'Estado', 'Fecha Registro'];
    }

    public function map($intern): array
    {
        return [
            $intern->id,
            $intern->name,
            $intern->last_name,
            $intern->dni,
            $intern->email,
            $intern->center?->name ?? 'N/A',
            $intern->status,
            $intern->created_at->format('d/m/Y'),
        ];
    }
}
