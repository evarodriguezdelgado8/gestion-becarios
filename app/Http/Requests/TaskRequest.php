<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
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
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            // 'intern_id'   => 'required|exists:interns,id',
            'intern_ids' => 'required|array|min:1',
            'intern_ids.*' => 'exists:interns,id',
            'center_ids' => 'nullable|array',
            'priority' => 'required|in:low,medium,high,urgent',
            'due_date' => 'nullable|date',
            'file' => 'nullable|file|max:5120',
        ];
    }

    public function messages(): array
    {
        return [
            'title.required' => 'El título de la tarea es obligatorio.',
            'title.max' => 'El título no puede exceder los 255 caracteres.',
            'intern_ids.required' => 'Debes asignar la tarea al menos a un becario.',
            'intern_ids.array' => 'El formato de selección de becarios no es válido.',
            'intern_ids.min' => 'Debes seleccionar al menos un becario de la lista.',
            'intern_ids.*.exists' => 'Uno de los becarios seleccionados no es válido.',
            'center_id.exists' => 'El centro seleccionado no existe.',
            'priority.required' => 'La prioridad es obligatoria.',
            'priority.in' => 'La prioridad seleccionada no es válida.',
            'file.max' => 'El archivo no puede pesar más de 5MB.',
        ];
    }
}
