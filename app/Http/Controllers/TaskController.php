<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\Intern;
use App\Models\Center;
use App\Http\Requests\TaskRequest;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redirect;


class TaskController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = Auth::user();

        $internProfile = \App\Models\Intern::where('user_id', $user->id)->first();

        $tasks = Task::query()
            ->with(['intern:id,name,last_name', 'creator:id,name', 'media'])
            ->when($internProfile, function ($query) use ($internProfile) {
                $query->where('intern_id', $internProfile->id);
            })

            ->when($request->input('search'), function ($query, $search) {
                $query->where(function($q) use ($search) {
                    $q->where('title', 'ilike', "%{$search}%")
                      ->orWhere('description', 'ilike', "%{$search}%");
                });
            })
            ->when($request->input('center_id'), function ($query, $centerId) {
                $query->where('center_id', $centerId);
            })
            ->when($request->input('intern_id'), function ($query, $internId) {
                $query->where('intern_id', $internId);
            })
            ->latest()
            ->get()
            ->map(function ($task) {
                $task->update_status_url = "/tareas/{$task->id}/status";
                return $task;
            });

        $kanban = [
            'pending'     => $tasks->where('status', 'pending')->values(),
            'in_progress' => $tasks->where('status', 'in_progress')->values(),
            'in_review'   => $tasks->where('status', 'in_review')->values(),
            'completed'   => $tasks->where('status', 'completed')->values(),
            'rejected'    => $tasks->where('status', 'rejected')->values(),
        ];

        return Inertia::render('tareas/index', [
            'kanban'  => $kanban,
            'interns' => Intern::all(['id', 'name', 'last_name']),
            'centers' => Center::all(['id', 'name']),
            'filters' => $request->only(['search', 'center_id', 'intern_id']),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(TaskRequest $request)
    {
        $validated = $request->validated();

        DB::transaction(function () use ($validated, $request) {
            $task = Task::create([
                ...$validated,
                'creator_id' => Auth::id(),
                'status'     => 'pending',
            ]);

            if ($request->hasFile('file')) {
                $task->addMediaFromRequest('file')->toMediaCollection('specifications');
            }
        });

        return Redirect::route('tareas.index')->with('success', 'Tarea asignada correctamente.');
    }

    /**
     * Display the specified resource.
     */
    /*public function show(Task $task)
    {
        return Inertia::render('tareas/show', [
            'task' => $task->load(['intern', 'creator', 'comments.user' => function($q) {
                $q->latest(); 
            }]),
            'documents' => [
                'specifications' => $task->getFirstMediaUrl('specifications'),
                'deliverables'   => $task->getMedia('deliverables')->map(fn($m) => [
                    'id' => $m->id,
                    'url' => $m->getUrl(),
                    'name' => $m->file_name
                ]),
            ]
        ]);
    }*/

    public function show($id)
    {
        $task = Task::with(['intern', 'creator', 'comments.user'])->findOrFail($id);

        return Inertia::render('tareas/show', [
            'task' => $task,
            'documents' => [
                'specifications' => $task->getFirstMediaUrl('specifications'),
                'deliverables'   => $task->getMedia('deliverables')->map(fn($m) => [
                    'url' => $m->getUrl(),
                    'name' => $m->file_name
                ]),
            ]
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Task $task)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(TaskRequest $request, $id)
    {
        $task = Task::findOrFail($id);
        $validated = $request->validated();

        DB::transaction(function () use ($validated, $request, $task) {
            $task->update($validated);

            if ($request->hasFile('file')) {
                $task->clearMediaCollection('specifications');
                $task->addMediaFromRequest('file')->toMediaCollection('specifications');
            }
        });

        return redirect()->back()->with('success', 'Tarea actualizada correctamente.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Task $task)
    {
        $task->delete();
        return Redirect::back()->with('success', 'Tarea eliminada.');
    }

    /**
     * Update task status.
     */
    public function updateStatus(Request $request, Task $task)
    {
        $request->validate([
            'status' => 'required|in:pending,in_progress,in_review,completed,rejected'
        ]);

        $task->update([
            'status' => $request->status,
            'completed_at' => $request->status === 'completed' ? now() : ($request->status === 'pending' ? null : $task->completed_at)
        ]);

        return redirect()->back()->with('success', 'Estado actualizado.');
    }

    /**
     * Add feedback/comments to a task.
     */
    public function storeComment(Request $request, Task $task)
    {
        // Validamos el cuerpo y el archivo si existe
        $request->validate([
            'body' => 'required|string',
            'deliverable' => 'nullable|file|max:10240', // Max 10MB
        ]);

        DB::transaction(function () use ($request, $task) {
            $task->comments()->create([
                'user_id' => Auth::id(),
                'body'    => $request->body
            ]);

            if ($request->hasFile('deliverable')) {
                $task->addMediaFromRequest('deliverable')->toMediaCollection('deliverables');
                
                $task->update(['status' => 'in_review']);
            }
        });

        return redirect()->back()->with('success', 'Comentario añadido.');
    }


}
