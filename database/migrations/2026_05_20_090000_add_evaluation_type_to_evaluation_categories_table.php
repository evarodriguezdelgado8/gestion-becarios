<?php

use App\Models\EvaluationCategory;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('evaluation_categories', function (Blueprint $table) {
            $table->string('evaluation_type')->default('weekly')->after('description');
        });

        EvaluationCategory::with('criteria')->get()->each(function (EvaluationCategory $category) {
            $category->update([
                'evaluation_type' => $category->criteria->first()?->evaluation_type ?? 'weekly',
            ]);
        });
    }

    public function down(): void
    {
        Schema::table('evaluation_categories', function (Blueprint $table) {
            $table->dropColumn('evaluation_type');
        });
    }
};
