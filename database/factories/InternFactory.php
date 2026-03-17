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
    return [
        'name' => $this->faker->firstName(),
        'last_name' => $this->faker->lastName(),
        'dni' => $this->faker->unique()->bothify('########?') , 
        'email' => $this->faker->unique()->safeEmail(),
        'phone' => $this->faker->phoneNumber(),
        'address' => $this->faker->address(),
        'status' => $this->faker->randomElement(['active', 'finished']),
        'start_date' => $this->faker->date(),
    ];
}
}
