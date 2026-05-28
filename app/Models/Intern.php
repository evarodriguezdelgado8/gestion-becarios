<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class Intern extends Model implements HasMedia
{
    use HasFactory, InteractsWithMedia, SoftDeletes;

    protected $fillable = [
        'user_id', 'tutor_id', 'center_id', 'name', 'last_name', 'dni', 'email', 'phone',
        'address', 'status', 'start_date', 'end_date',
        'academic_cycle', 'academic_tutor', 'total_hours', 'completed_hours',
    ];

    protected $appends = ['progress_percentage'];

    public function getProgressPercentageAttribute(): int
    {
        if ($this->total_hours <= 0) {
            return 0;
        }

        return (int) min(100, ($this->completed_hours / $this->total_hours) * 100);
    }

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('documents')
            ->useDisk('public');

        $this->addMediaCollection('dni_scan')->singleFile();
        $this->addMediaCollection('convenio')->singleFile();
        $this->addMediaCollection('seguro')->singleFile();
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }

    public function center(): BelongsTo
    {
        return $this->belongsTo(Center::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function tutor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'tutor_id');
    }
}
