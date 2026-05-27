# Dockerfile para despliegue en Railway (Eva - gestion-becarios)
# Imagen base con PHP 8.4 CLI sobre Debian.
# Eva requiere PHP 8.4 por spatie/laravel-activitylog 5.0 y symfony 8.x.
FROM php:8.4-cli

ENV DEBIAN_FRONTEND=noninteractive \
    COMPOSER_ALLOW_SUPERUSER=1 \
    COMPOSER_NO_INTERACTION=1

# --- Dependencias del sistema ---
RUN apt-get update && apt-get install -y --no-install-recommends \
        git \
        unzip \
        ca-certificates \
        curl \
        libzip-dev \
        libpng-dev \
        libjpeg-dev \
        libfreetype6-dev \
        libpq-dev \
        libicu-dev \
        libonig-dev \
    && rm -rf /var/lib/apt/lists/*

# --- Node.js 20 (para compilar assets con Vite) ---
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

# --- Extensiones de PHP requeridas por el proyecto ---
RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) \
        pdo \
        pdo_pgsql \
        gd \
        exif \
        intl \
        zip \
        bcmath \
        opcache

# --- Composer ---
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# --- Código de la aplicación ---
WORKDIR /app
COPY . .

# Crear .env mínimo para los artisan que se ejecutan en build.
# Las variables reales las inyecta Railway en runtime.
RUN cp .env.example .env || true

# Instalar dependencias PHP (sin dev) y compilar assets.
RUN composer install --no-dev --optimize-autoloader --no-interaction \
    && npm ci \
    && npm run build \
    && rm -rf node_modules

# Permisos sobre storage y bootstrap/cache.
RUN chmod -R 775 storage bootstrap/cache

EXPOSE 8080

# En arranque: migrar, cachear config/rutas/vistas y servir.
CMD php artisan migrate --force \
    && php artisan db:seed \
    && php artisan config:cache \
    && php artisan route:cache \
    && php artisan view:cache \
    && php artisan serve --host 0.0.0.0 --port ${PORT:-8080}
