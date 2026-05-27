<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Spatie\Activitylog\Support\LogOptions;
use Spatie\Activitylog\Models\Concerns\LogsActivity;
use Illuminate\Support\Facades\Cache;

class Task extends Model implements HasMedia
{
    use HasFactory, InteractsWithMedia, LogsActivity;

    protected $fillable = [
        'title', 
        'description', 
        'status', 
        'priority', 
        'creator_id', 
        'intern_id', 
        'center_id', 
        'due_date', 
        'completed_at',
        'order_index'
    ];

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['title', 'description', 'status', 'priority']) 
            ->logOnlyDirty()
            ->logFillable()
            ->dontLogIfAttributesChangedOnly(['updated_at', 'order_index'])
            ->useLogName('task');
    }

    
    protected $casts = [
        'due_date' => 'date:Y-m-d',
        'completed_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::saved(fn () => self::refreshDashboardCache());
        static::deleted(fn () => self::refreshDashboardCache());
    }

    private static function refreshDashboardCache(): void
    {
        Cache::forever('dashboard.version', ((int) Cache::get('dashboard.version', 1)) + 1);
    }

    public function creator(): BelongsTo {
        return $this->belongsTo(User::class, 'creator_id');
    }

    public function intern(): BelongsTo {
        return $this->belongsTo(Intern::class);
    }

    public function center(): BelongsTo {
        return $this->belongsTo(Center::class);
    }

    public function comments(): HasMany {
        return $this->hasMany(TaskComment::class)->latest();
    }

    public function registerMediaCollections(): void {
        $this->addMediaCollection('specifications')->singleFile(); 
        $this->addMediaCollection('deliverables'); 
    }

    
}
