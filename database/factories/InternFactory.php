<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Intern>
 */
class InternFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $startDate = $this->faker->dateTimeBetween('-6 months', 'now');
        
        $endDate = (clone $startDate)->modify('+' . rand(3, 6) . ' months');

        return [
            'name' => $this->faker->firstName(),
            'last_name' => $this->faker->lastName(),
            'dni' => $this->faker->unique()->bothify('########?') , 
            'email' => $this->faker->unique()->safeEmail(),
            'phone' => $this->faker->phoneNumber(),
            'address' => $this->faker->address(),
            'academic_cycle' => $this->faker->randomElement(['DAW', 'DAM', 'ASIR']),
            'academic_tutor' => $this->faker->name(),
            'status' => $this->faker->randomElement(['active', 'finished', 'abandoned']),
            'start_date' => $startDate->format('Y-m-d'),
            'end_date' => $endDate->format('Y-m-d'),
            'total_hours' => 400,
            'completed_hours' => $this->faker->numberBetween(0, 400),
        ];
    }
}
