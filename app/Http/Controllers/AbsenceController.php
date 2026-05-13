<?php

namespace App\Http\Controllers;

use App\Models\Absence;
use App\Models\Intern;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class AbsenceController extends Controller
{
    public function store(Request $request)
    {
        $user = Auth::user();

        if (! $user || ! $user->hasRole('intern') || ! Intern::where('user_id', $user->id)->exists()) {
            abort(403);
        }

        $request->validate([
            'date' => 'required|date',
            'reason' => 'required|string|max:255',
            'attachment' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
        ]);

        $alreadyRequested = Absence::query()
            ->where('user_id', $user->id)
            ->whereDate('date', $request->date)
            ->whereIn('status', ['pending', 'approved'])
            ->exists();

        if ($alreadyRequested) {
            throw ValidationException::withMessages([
                'date' => 'Ya tienes una solicitud pendiente o aprobada para esa fecha.',
            ]);
        }

        $attachmentPath = $request->hasFile('attachment')
            ? $request->file('attachment')->store('absence-attachments', 'public')
            : null;

        Absence::create([
            'user_id' => $user->id,
            'date' => $request->date,
            'reason' => $request->reason,
            'attachment_path' => $attachmentPath,
            'status' => 'pending',
            'tutor_comment' => null,
        ]);

        return back()->with('success', 'Solicitud de ausencia enviada correctamente.');
    }

    public function update(Request $request, Absence $absence)
    {
        $user = Auth::user();

        if (!$user || !$user->hasAnyRole(['admin', 'tutor'])) {
            abort(403);
        }

        $request->validate([
            'status' => 'required|in:approved,rejected',
            'tutor_comment' => 'nullable|string|max:1000',
        ]);

        $absence->update([
            'status' => $request->status,
            'tutor_comment' => $request->tutor_comment,
            'reviewed_at' => now(),
        ]);

        return back()->with('success', 'Ausencia actualizada correctamente.');
    }
}
