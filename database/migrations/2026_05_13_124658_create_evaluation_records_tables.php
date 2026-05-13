<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('evaluations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('intern_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('tutor_id')->constrained('users')->onDelete('cascade');
            $table->enum('type', ['weekly', 'monthly', 'final']);
            $table->string('period_name'); // Ej: "Enero 2026" o "Semana 12"
            $table->decimal('final_grade', 4, 2)->default(0);
            $table->text('comments')->nullable();
            $table->timestamps();
        });

        Schema::create('evaluation_results', function (Blueprint $table) {
            $table->id();
            $table->foreignId('evaluation_id')->constrained()->onDelete('cascade');
            $table->foreignId('evaluation_criterion_id')->constrained()->onDelete('cascade');
            $table->integer('score'); // 1 a 5
            $table->text('feedback')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('evaluation_records_tables');
    }
};
