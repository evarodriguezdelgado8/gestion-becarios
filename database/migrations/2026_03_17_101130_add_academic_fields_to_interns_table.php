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
        Schema::table('interns', function (Blueprint $table) {
            $table->string('academic_cycle')->after('address')->nullable(); 
            $table->string('academic_tutor')->after('academic_cycle')->nullable(); 
            $table->date('end_date')->after('start_date')->nullable();
            
            $table->integer('total_hours')->after('end_date')->default(400);
            $table->integer('completed_hours')->after('total_hours')->default(0);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('interns', function (Blueprint $table) {
            $table->dropColumn([
                'academic_cycle', 
                'academic_tutor', 
                'end_date', 
                'total_hours', 
                'completed_hours'
            ]);
        });
    }
};