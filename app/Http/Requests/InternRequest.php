<?php

namespace App\Http\Requests;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use App\Rules\ValidDni;

class InternRequest extends FormRequest
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
        $intern = $this->route('intern');
        $internId = $intern instanceof \App\Models\Intern ? $intern->id : $intern;
        $ignoreId = $internId ? ',' . $internId : '';

        return [
            'name'              => 'required|string|max:255',
            'last_name'         => 'required|string|max:255',
            'dni' => [
                'required', 
                'string', 
                new ValidDni, 
                'unique:interns,dni' . $ignoreId
            ],
            'email'             => 'required|email|unique:interns,email' . $ignoreId,
            'phone'             => 'required|string',
            'address'           => 'required|string',

            'center_id'         => 'required|exists:centers,id',
            'tutor_id'          => 'required|exists:users,id',
            'academic_cycle'    => 'required|in:ASIR,DAM,DAW',
            'academic_tutor'    => 'required|string|max:255',

            'start_date'        => 'required|date',
            'end_date'          => 'required|date|after:start_date',
            'total_hours'       => 'required|integer|min:1',
            'completed_hours'   => 'required|integer|min:0',

            'status'            => 'required|in:active,finished,abandoned',

            'document_dni'      => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:2048',
            'document_convenio' => 'nullable|file|mimes:pdf|max:5120',
            'document_seguro'   => 'nullable|file|mimes:pdf|max:5120',
        ];
    }


    public function messages(): array
    {
        return [
            'dni.unique' => 'Este DNI ya está registrado en el sistema.',
            'email.unique' => 'Este correo electrónico ya está en uso.',
            'end_date.after' => 'La fecha de fin debe ser posterior a la de inicio.',
        ];
    }
    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            if (! $this->filled('tutor_id')) {
                return;
            }

            $tutor = User::find($this->input('tutor_id'));

            if (! $tutor?->hasRole('tutor')) {
                $validator->errors()->add('tutor_id', 'El tutor asignado debe ser un usuario con rol tutor.');
            }
        });
    }
}
