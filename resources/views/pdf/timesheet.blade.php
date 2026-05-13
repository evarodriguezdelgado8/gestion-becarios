<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <title>Parte de horas</title>
    <style>
        * {
            box-sizing: border-box;
        }

        body {
            color: #0f172a;
            font-family: DejaVu Sans, sans-serif;
            font-size: 11px;
            line-height: 1.35;
        }

        h1, h2, h3, p {
            margin: 0;
        }

        .header {
            border-bottom: 2px solid #0f172a;
            margin-bottom: 14px;
            padding-bottom: 10px;
        }

        .title {
            font-size: 22px;
            font-weight: 700;
            letter-spacing: .02em;
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

        .meta-row {
            margin-bottom: 3px;
        }

        .label {
            color: #64748b;
            display: inline-block;
            width: 90px;
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
            width: 16.66%;
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
            font-size: 15px;
            font-weight: 700;
            margin-top: 3px;
        }

        table {
            border-collapse: collapse;
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

        td.center, th.center {
            text-align: center;
        }

        .status {
            border-radius: 4px;
            display: inline-block;
            font-size: 9px;
            font-weight: 700;
            padding: 2px 5px;
        }

        .status-ok {
            background: #dcfce7;
            color: #166534;
        }

        .status-warn {
            background: #fef3c7;
            color: #92400e;
        }

        .status-danger {
            background: #ffe4e6;
            color: #be123c;
        }

        .status-muted {
            background: #f1f5f9;
            color: #475569;
        }

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
        <h1 class="title">Parte de horas {{ strtolower($periodLabel) }}</h1>
        <p class="subtitle">
            Periodo: {{ $startDate->format('d/m/Y') }} - {{ $endDate->format('d/m/Y') }}
            · Generado: {{ $generatedAt->format('d/m/Y H:i') }}
        </p>
    </div>

    <div class="grid">
        <div class="col">
            <div class="box">
                <p class="box-title">Becario</p>
                <p class="meta-row"><span class="label">Nombre</span>{{ $intern->name }} {{ $intern->last_name }}</p>
                <p class="meta-row"><span class="label">DNI</span>{{ $intern->dni ?? 'No indicado' }}</p>
                <p class="meta-row"><span class="label">Ciclo</span>{{ $intern->academic_cycle ?? 'No indicado' }}</p>
                <p class="meta-row"><span class="label">Tutor</span>{{ $intern->academic_tutor ?? 'No indicado' }}</p>
            </div>
        </div>
        <div class="col">
            <div class="box">
                <p class="box-title">Centro educativo</p>
                <p class="meta-row"><span class="label">Centro</span>{{ $center?->name ?? 'No indicado' }}</p>
                <p class="meta-row"><span class="label">Contacto</span>{{ $center?->contact_name ?? 'No indicado' }}</p>
                <p class="meta-row"><span class="label">Email</span>{{ $center?->contact_email ?? $center?->email ?? 'No indicado' }}</p>
                <p class="meta-row"><span class="label">Teléfono</span>{{ $center?->contact_phone ?? $center?->phone ?? 'No indicado' }}</p>
            </div>
        </div>
    </div>

    <div class="summary">
        <div class="summary-item">
            <span class="summary-label">Trabajadas</span>
            <span class="summary-value">{{ $summary['worked_hours_label'] }}</span>
        </div>
        <div class="summary-item">
            <span class="summary-label">Previstas</span>
            <span class="summary-value">{{ $summary['expected_hours_label'] }}</span>
        </div>
        <div class="summary-item">
            <span class="summary-label">Objetivo</span>
            <span class="summary-value">{{ number_format($summary['target_hours'], 0, ',', '.') }} h</span>
        </div>
        <div class="summary-item">
            <span class="summary-label">Avance</span>
            <span class="summary-value">{{ number_format($summary['progress'], 1, ',', '.') }}%</span>
        </div>
        <div class="summary-item">
            <span class="summary-label">Ausencias</span>
            <span class="summary-value">{{ $summary['absence_count'] }}</span>
        </div>
        <div class="summary-item">
            <span class="summary-label">Incidencias</span>
            <span class="summary-value">{{ $summary['late_count'] + $summary['missed_count'] }}</span>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th>Fecha</th>
                <th>Horario previsto</th>
                <th class="center">Entrada</th>
                <th class="center">Salida</th>
                <th class="center">Horas</th>
                <th>Estado</th>
                <th>Observaciones</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($rows as $row)
                @php
                    $statusClass = match (true) {
                        str_contains($row['status'], 'Retraso'),
                        str_contains($row['status'], 'pendiente') => 'status-warn',
                        str_contains($row['status'], 'Sin fichaje'),
                        str_contains($row['status'], 'rechazada') => 'status-danger',
                        str_contains($row['status'], 'Puntual'),
                        str_contains($row['status'], 'aprobada') => 'status-ok',
                        default => 'status-muted',
                    };
                @endphp
                <tr>
                    <td>
                        <strong>{{ $row['date']->format('d/m/Y') }}</strong><br>
                        {{ ucfirst($row['date']->locale('es')->isoFormat('dddd')) }}
                    </td>
                    <td>{{ $row['planned'] }}</td>
                    <td class="center">{{ $row['check_in'] }}</td>
                    <td class="center">{{ $row['check_out'] }}</td>
                    <td class="center">{{ $row['hours'] }}</td>
                    <td><span class="status {{ $statusClass }}">{{ $row['status'] }}</span></td>
                    <td>{{ $row['note'] ?: '-' }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <p class="footer">
        Documento generado automaticamente desde Gestion de Becarios.
    </p>
</body>
</html>
