<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Spatie\Permission\Traits\HasRoles;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use App\Models\TimeRegistry;
use App\Models\Schedule;
use App\Models\Absence;

class User extends Authenticatable implements MustVerifyEmail, HasMedia
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, TwoFactorAuthenticatable, HasRoles, InteractsWithMedia;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'remember_token',
    ];

    /**
     * Los atributos que se añaden al JSON cuando se envía a React/Inertia.
     */
    protected $appends = [
        'photo_url',
    ];

    /**
     * Configuración de Spatie Media Library.
     * singleFile() asegura que al subir una foto nueva se borre la anterior.
     */
    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('profile_photo')
             ->singleFile();
    }

    /**
     * Accessor para obtener la URL de la foto de perfil.
     * Si el usuario no tiene foto, genera un avatar con sus iniciales.
     */
    public function getPhotoUrlAttribute(): ?string
    {
        /*return $this->getFirstMediaUrl('profile_photo') 
            ?: 'https://ui-avatars.com/api/?name=' . urlencode($this->name) . '&color=7F9CF5&background=EBF4FF';*/
            $url = $this->getFirstMediaUrl('profile_photo');
            return $url ?: null;
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
        ];
    }


    // Relación con los horarios semanales
    public function schedules()
    {
        return $this->hasMany(Schedule::class);
    }

    // Relación con los fichajes diarios
    public function timeRegistries()
    {
        return $this->hasMany(TimeRegistry::class);
    }

    // Relación con las ausencias
    public function absences()
    {
        return $this->hasMany(Absence::class);
    }



}