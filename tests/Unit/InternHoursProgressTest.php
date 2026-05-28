<?php

use App\Models\Intern;

test('intern progress percentage is calculated from completed and required hours', function () {
    $intern = new Intern([
        'completed_hours' => 125,
        'total_hours' => 400,
    ]);

    expect($intern->progress_percentage)->toBe(31);
});

test('intern progress percentage is capped at one hundred percent', function () {
    $intern = new Intern([
        'completed_hours' => 450,
        'total_hours' => 400,
    ]);

    expect($intern->progress_percentage)->toBe(100);
});

test('intern progress percentage is zero when required hours are missing', function () {
    $intern = new Intern([
        'completed_hours' => 40,
        'total_hours' => 0,
    ]);

    expect($intern->progress_percentage)->toBe(0);
});
