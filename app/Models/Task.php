<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Task extends Model implements HasMedia
{
    use HasFactory, InteractsWithMedia;

    protected $fillable = [
        'title', 
        'description', 
        'status', 
        'priority', 
        'creator_id', 
        'intern_id', 
        'center_id', 
        'due_date', 
        'completed_at'
    ];

    protected $casts = [
        'due_date' => 'date:Y-m-d',
        'completed_at' => 'datetime',
    ];

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
