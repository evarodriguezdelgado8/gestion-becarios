<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class ValidDni implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $value = strtoupper(str_replace([' ', '-'], '', $value));
        $letras = "TRWAGMYFPDXBNJZSQVHLCKE";

        if (preg_match('/^[0-9]{8}[A-Z]$/', $value)) {
            $numero = substr($value, 0, 8);
            $letraInput = substr($value, -1);
            if ($letras[$numero % 23] !== $letraInput) {
                $fail('La letra del DNI no coincide con el número introducido.');
            }
        } 
        elseif (preg_match('/^[XYZ][0-9]{7}[A-Z]$/', $value)) {
            $nieReplace = ['X' => 0, 'Y' => 1, 'Z' => 2];
            $prefijo = substr($value, 0, 1);
            $numeroBase = $nieReplace[$prefijo] . substr($value, 1, 7);
            $letraInput = substr($value, -1);
            
            if ($letras[$numeroBase % 23] !== $letraInput) {
                $fail('La letra del NIE no es correcta.');
            }
        } 
        else {
            $fail('El formato del DNI/NIE no es válido (ej: 12345678Z).');
        }
    }
}