<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <title>Informe de evaluación</title>
    <style>
        * { box-sizing: border-box; }
        body {
            color: #0f172a;
            font-family: DejaVu Sans, sans-serif;
            font-size: 11px;
            line-height: 1.35;
        }
        h1, h2, h3, p { margin: 0; }
        .header {
            border-bottom: 2px solid #0f172a;
            margin-bottom: 14px;
            padding-bottom: 10px;
        }
        .title {
            font-size: 22px;
            font-weight: 700;
        }
        .subtitle {
            color: #475569;
            font-size: 12px;
            margin-top: 4px;
        }
        .grid {
            display: table;
            margin-bottom: 14px;
            width: 100%;
        }
        .col {
            display: table-cell;
            padding-right: 10px;
            vertical-align: top;
            width: 50%;
        }
        .box {
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            padding: 10px;
        }
        .box-title {
            color: #334155;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: .08em;
            margin-bottom: 6px;
            text-transform: uppercase;
        }
        .meta-row { margin-bottom: 3px; }
        .label {
            color: #64748b;
            display: inline-block;
            width: 95px;
        }
        .summary {
            display: table;
            margin-bottom: 14px;
            width: 100%;
        }
        .summary-item {
            border: 1px solid #cbd5e1;
            display: table-cell;
            padding: 8px;
            text-align: center;
            width: 25%;
        }
        .summary-label {
            color: #64748b;
            display: block;
            font-size: 9px;
            font-weight: 700;
            letter-spacing: .06em;
            text-transform: uppercase;
        }
        .summary-value {
            display: block;
            font-size: 16px;
            font-weight: 700;
            margin-top: 3px;
        }
        table {
            border-collapse: collapse;
            margin-top: 8px;
            width: 100%;
        }
        th {
            background: #f1f5f9;
            color: #334155;
            font-size: 9px;
            letter-spacing: .05em;
            text-align: left;
            text-transform: uppercase;
        }
        th, td {
            border: 1px solid #cbd5e1;
            padding: 6px;
            vertical-align: top;
        }
        td.center, th.center { text-align: center; }
        .comment {
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            margin-bottom: 14px;
            padding: 10px;
        }
        .muted { color: #64748b; }
        .footer {
            color: #64748b;
            font-size: 9px;
            margin-top: 12px;
            text-align: right;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1 class="title">Informe de evaluación {{ strtolower($typeLabel) }}</h1>
        <p class="subtitle">
            Periodo: {{ $evaluation->period_name }}
            · Generado: {{ $generatedAt->format('d/m/Y H:i') }}
        </p>
    </div>

    <div class="grid">
        <div class="col">
            <div class="box">
                <p class="box-title">Becario</p>
                <p class="meta-row"><span class="label">Nombre</span>{{ trim(($internProfile?->name ?? $intern?->name ?? '').' '.($internProfile?->last_name ?? '')) ?: 'No indicado' }}</p>
                <p class="meta-row"><span class="label">Email</span>{{ $intern?->email ?? 'No indicado' }}</p>
                <p class="meta-row"><span class="label">Ciclo</span>{{ $internProfile?->academic_cycle ?? 'No indicado' }}</p>
                <p class="meta-row"><span class="label">Centro</span>{{ $center?->name ?? 'No indicado' }}</p>
            </div>
        </div>
        <div class="col">
            <div class="box">
                <p class="box-title">Evaluación</p>
                <p class="meta-row"><span class="label">Tipo</span>{{ $typeLabel }}</p>
                <p class="meta-row"><span class="label">Fecha</span>{{ $evaluation->created_at?->format('d/m/Y') ?? 'No indicada' }}</p>
                <p class="meta-row"><span class="label">Tutor</span>{{ $evaluation->tutor?->name ?? 'No indicado' }}</p>
                <p class="meta-row"><span class="label">Nota final</span>{{ number_format((float) $evaluation->final_grade * 2, 1, ',', '.') }} / 10</p>
            </div>
        </div>
    </div>

    <div class="summary">
        <div class="summary-item">
            <span class="summary-label">Nota final</span>
            <span class="summary-value">{{ number_format((float) $evaluation->final_grade * 2, 1, ',', '.') }} / 10</span>
        </div>
        <div class="summary-item">
            <span class="summary-label">Criterios</span>
            <span class="summary-value">{{ $evaluation->results->count() }}</span>
        </div>
        <div class="summary-item">
            <span class="summary-label">Tipo</span>
            <span class="summary-value">{{ $typeLabel }}</span>
        </div>
        <div class="summary-item">
            <span class="summary-label">Periodo</span>
            <span class="summary-value">{{ $evaluation->period_name }}</span>
        </div>
    </div>

    @if ($evaluation->comments)
        <div class="comment">
            <p class="box-title">Comentario general</p>
            <p>{{ $evaluation->comments }}</p>
        </div>
    @endif

    <p class="box-title">Detalle por criterio</p>
    <table>
        <thead>
            <tr>
                <th>Categoría</th>
                <th>Criterio</th>
                <th class="center">Peso</th>
                <th class="center">Puntuación</th>
                <th>Comentario</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($evaluation->results as $result)
                <tr>
                    <td>{{ $result->criterion?->category?->name ?? 'Sin categoría' }}</td>
                    <td>{{ $result->criterion?->name ?? 'Criterio eliminado' }}</td>
                    <td class="center">{{ $result->criterion?->weight ?? '-' }}%</td>
                    <td class="center"><strong>{{ $result->score }} / 5</strong></td>
                    <td>{{ $result->feedback ?: 'Sin comentario' }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <p class="footer">
        Documento generado automáticamente desde Gestión de Becarios.
    </p>
</body>
</html>
