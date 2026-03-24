<?php

namespace App\Exports;

use App\Models\Intern;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;

class InternsExport implements FromQuery, WithMapping, WithHeadings, ShouldAutoSize
{
    protected $filters;

    public function __construct($filters = [])
    {
        $this->filters = $filters;
    }

    public function query()
    {
        $query = Intern::query()->with('center:id,name');

        if (!empty($this->filters['search'])) {
            $search = $this->filters['search'];
            $query->where(function($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                  ->orWhere('last_name', 'ilike', "%{$search}%")
                  ->orWhere('dni', 'ilike', "%{$search}%")
                  ->orWhere('email', 'ilike', "%{$search}%");
            });
        }

        // Filtro por Centro
        if (!empty($this->filters['center_id'])) {
            $query->where('center_id', $this->filters['center_id']);
        }

        // Filtro por Estado
        if (!empty($this->filters['status'])) {
            $query->where('status', $this->filters['status']);
        }

        if (!empty($this->filters['from'])) {
            $query->whereDate('start_date', '>=', $this->filters['from']);
        }
        if (!empty($this->filters['to'])) {
            $query->whereDate('end_date', '<=', $this->filters['to']);
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