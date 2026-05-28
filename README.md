# EduTrack - Gestion de becarios

Aplicacion web para gestionar becarios, centros educativos, tareas, control horario, evaluaciones, dashboard y reportes.

## Stack

- Laravel 12
- Inertia.js
- React 19 + TypeScript
- Tailwind CSS + shadcn/ui
- PostgreSQL
- Spatie Permission, Media Library y PDF
- Laravel Excel
- Recharts
- Pest PHP

## Modulos implementados

- Autenticacion con verificacion de email, recuperacion de contrasena y 2FA.
- Roles: `admin`, `tutor`, `intern`.
- Gestion de centros educativos.
- Gestion de becarios con documentos, soft delete, filtros, exportacion e invitaciones por email.
- Asignacion de tutores a becarios desde administracion.
- Gestion de tareas con Kanban, comentarios y entregables.
- Control horario con fichaje, registros manuales, ausencias, horarios y partes PDF.
- Evaluacion y notas con criterios configurables, historial e informes PDF.
- Dashboard por rol con KPIs, graficos, cumplimiento horario, tareas y alertas.
- Reportes con seleccion de campos, filtros, agrupacion, plantillas y exportacion.
- Administracion de usuarios, roles y permisos.

## Credenciales demo

Estas credenciales las crea `DatabaseSeeder`:

| Rol | Email | Contrasena |
| --- | --- | --- |
| Admin | `prueba@gestion-becarios.com` | `12345678` |
| Tutor | `tutor@ejemplo.com` | `12345678` |
| Becario | `becario@ejemplo.com` | `12345678` |

Tambien se crean otros tutores, centros y becarios de prueba.

## Instalacion local

```bash
composer install
npm install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
```

Configura PostgreSQL y Mailpit en `.env` antes de migrar si no usas los valores por defecto.

## Desarrollo

```bash
composer run dev
```

Este comando levanta Laravel, Vite y la cola.

Si prefieres procesos separados:

```bash
php artisan serve
npm run dev
php artisan queue:listen
```

## Emails en local

El proyecto usa los canales de email de Laravel. En local se recomienda Mailpit:

```env
MAIL_MAILER=smtp
MAIL_HOST=127.0.0.1
MAIL_PORT=1025
MAIL_FROM_ADDRESS="noreply@edutrack.local"
MAIL_FROM_NAME="EduTrack"
```

Flujos principales con email:

- Verificacion de email.
- Recuperacion de contrasena.
- Invitacion a becarios para crear acceso.
- Creacion de admin/tutor desde administracion.

## Comandos de validacion

```bash
php artisan test
php artisan test --coverage
npm run lint:check
npm run types:check
npm run build
```

Resultado de la ultima revision local:

- `php artisan test`: 82 tests pasando.
- `npm run lint:check`: correcto.
- `npm run types:check`: correcto.
- `npm run build`: correcto.

Nota: en Windows puede aparecer un aviso de Pest indicando que no puede escribir su cache temporal en `vendor/pestphp/pest/.temp/test-results`. No rompe los tests.

Nota de cobertura: `php artisan test --coverage` requiere Xdebug o PCOV instalado y activado en PHP.

## Roles y permisos

### Admin

- Acceso completo.
- Gestiona centros, becarios, tareas, evaluaciones, reportes, usuarios, roles, permisos y asignacion de tutores.
- Puede crear nuevos admins y tutores.
- Puede cambiar roles de usuarios.

### Tutor

- Ve solo sus becarios asignados.
- Gestiona tareas, control horario y evaluaciones de sus becarios.
- Puede enviar invitaciones a sus becarios.
- No puede acceder a administracion global.

### Becario

- Accede a su dashboard, tareas, control horario y evaluaciones propias.
- Puede fichar entrada/salida, solicitar ausencias y subir entregables.

## Flujos clave de entrega

### Alta de becario

1. Admin crea el becario desde `Gestion de Becarios`.
2. Puede dejarlo sin tutor asignado.
3. Admin asigna tutor desde `Usuarios y Roles > Asignacion de tutores`.
4. Admin o tutor envia invitacion de acceso.
5. El becario recibe email y establece contrasena.

### Asignacion de tutor

1. Admin entra en `Usuarios y Roles`.
2. Abre `Asignacion de tutores`.
3. Filtra por tutor, sin tutor o texto.
4. Cambia el tutor desde la fila del becario.

### Reportes

1. Admin/tutor entra en `Reportes`.
2. Selecciona tipo, campos, filtros y agrupacion.
3. Puede guardar plantilla.
4. Puede exportar a Excel/PDF segun el reporte disponible.

## Testing cubierto

- Autenticacion: login, registro desactivado, verificacion, recuperacion y 2FA.
- CRUD de centros.
- CRUD de becarios y control de acceso.
- Scopes de tutor en becarios, tareas, control horario, evaluaciones y reportes.
- Invitaciones individuales y masivas.
- Dashboard por rol y refresco de cache tras cambios de tareas.
- Reportes, plantillas, agrupaciones y exportacion.
- Control horario basico y validaciones de solapamiento.
- Gestion de usuarios y roles.
- Asignacion de tutores.

## Produccion

El `Dockerfile` ejecuta:

```bash
php artisan migrate --force
php artisan db:seed --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan serve --host 0.0.0.0 --port ${PORT:-8080}
```

Los seeders principales no dependen de Faker, para que funcionen con `composer install --no-dev`.
