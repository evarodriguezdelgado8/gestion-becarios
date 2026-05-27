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
        Schema::create('interns', function (Blueprint $table) {
        $table->id();
        
        $table->foreignId('center_id')->constrained()->onDelete('cascade');
        
        $table->string('name');
        $table->string('last_name');
        $table->string('dni')->unique();
        $table->string('email')->unique();
        $table->string('phone');
        $table->string('address');

        $table->string('status')->default('active'); 
        $table->date('start_date');

        $table->timestamps();
        $table->softDeletes();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('interns');
    }
};
