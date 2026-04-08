<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class TaskRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'title'       => 'required|string|max:255',
            'description' => 'nullable|string',
            'intern_id'   => 'required|exists:interns,id',
            'center_id'   => 'required|exists:centers,id',
            'priority'    => 'required|in:low,medium,high,urgent',
            'due_date'    => 'nullable|date',
            'file'        => 'nullable|file|max:5120',
        ];
    }

    public function messages(): array
    {
        return [
            'title.required'     => 'El título de la tarea es obligatorio.',
            'intern_id.required' => 'Debes asignar la tarea a un becario.',
            'center_id.required' => 'El centro es obligatorio.',
            'priority.in'        => 'La prioridad seleccionada no es válida.',
            'file.max'           => 'El archivo no puede pesar más de 5MB.',
        ];
    }
}
