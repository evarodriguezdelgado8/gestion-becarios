<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CenterRequest extends FormRequest
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
        
        $center = $this->route('center');
        $centerId = $center instanceof \App\Models\Center ? $center->id : $center;

       
        $ignoreId = $centerId ? ',' . $centerId : '';

        return [
            'nif'           => 'required|string|unique:centers,nif' . $ignoreId,
            'name'          => 'required|string|max:255',
            'address'       => 'required|string',
            'phone'         => 'required|string',
            'email'         => 'required|email|unique:centers,email' . $ignoreId,
            'web'           => 'nullable|url',
            'contact_name'  => 'required|string|max:255',
            'contact_role'  => 'required|string|max:255',
            'contact_phone' => 'required|string',
            'contact_email' => 'required|email',
        ];
    }
}
