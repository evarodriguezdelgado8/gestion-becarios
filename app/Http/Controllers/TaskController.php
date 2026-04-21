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
use Spatie\Activitylog\Models\Activity;


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
            ->with(['intern:id,name,last_name,academic_cycle', 'creator:id,name', 'media', 'comments'])
            
            ->when($internProfile, function ($query) use ($internProfile) {
                $query->where('intern_id', $internProfile->id);
            })

            ->when($request->input('search'), function ($query, $search) {
                $query->where(function($q) use ($search) {
                    $q->where('title', 'ilike', "%{$search}%")
                    ->orWhere('description', 'ilike', "%{$search}%");
                });
            })

            ->when($request->input('center_id'), function ($query, $centerIds) {
                $ids = is_array($centerIds) ? $centerIds : explode(',', $centerIds);
                $query->whereIn('center_id', $ids);
            })

            ->when($request->input('intern_id'), function ($query, $internIds) {
                $ids = is_array($internIds) ? $internIds : explode(',', $internIds);
                $query->whereIn('intern_id', $ids);
            })

            ->when($request->input('priority'), function ($query, $priorities) {
                $list = is_array($priorities) ? $priorities : explode(',', $priorities);
                $query->whereIn('priority', $list);
            })

            ->when($request->input('due_date'), function ($query, $date) {
                $query->whereDate('due_date', $date);
            })

            ->when($request->input('academic_cycle'), function ($query, $cycles) {
                $cyclesArray = is_array($cycles) ? $cycles : explode(',', $cycles);
                $cyclesLower = array_map('strtolower', $cyclesArray);

                $query->whereHas('intern', function ($q) use ($cyclesLower) {
                    $q->whereIn(\DB::raw('LOWER(academic_cycle)'), $cyclesLower);
                });
            })

            ->orderBy('order_index', 'asc')
            ->get()
            ->map(function ($task) {
                $task->update_status_url = route('tareas.updateStatus', $task->id);
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
            'interns' => Intern::all(['id', 'name', 'last_name', 'center_id', 'academic_cycle']),
            'centers' => Center::all(['id', 'name']),
            'filters' => $request->only(['search', 'center_id', 'intern_id', 'priority', 'academic_cycle', 'due_date']),
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
        
        $status = $request->input('status', 'pending');

        DB::transaction(function () use ($validated, $request, $status) {
            foreach ($validated['intern_ids'] as $internId) {

                $intern = Intern::findOrFail($internId);

                $lastOrder = Task::where('status', $status)->max('order_index') ?? 0;

                $task = Task::create([
                    'title'       => $validated['title'],
                    'description' => $validated['description'],
                    'priority'    => $validated['priority'],
                    'due_date'    => $validated['due_date'],
                    'center_id'   => $intern->center_id,
                    'intern_id'   => $internId,
                    'creator_id'  => Auth::id(),
                    'status'      => $status, 
                    'order_index' => $lastOrder + 1,
                ]);

                if ($request->hasFile('file')) {
                    $task->addMedia($request->file('file'))
                        ->preservingOriginal()
                        ->toMediaCollection('specifications');
                }
            }
        });

        return Redirect::route('tareas.index')->with('success', 'Tareas asignadas correctamente.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Task $task)
    {
        $task->load(['intern', 'creator', 'comments.user']);

        $activityLog = Activity::forSubject($task)
            ->with('causer')
            ->latest()
            ->get()
            ->map(function ($activity) {
                return [
                    'id' => $activity->id,
                    'description' => $activity->description,
                    'user' => $activity->causer->name ?? 'Sistema',
                    'date' => $activity->created_at->diffForHumans(),
                    'attribute_changes' => $activity->attribute_changes, 
                    'properties' => $activity->properties,
                    'translation' => $this->translateActivity($activity),
                ];
            });

        return Inertia::render('tareas/show', [
            'task' => $task->load(['intern', 'creator', 'comments.user']),
            'interns' => \App\Models\Intern::all(),
            'centers' => \App\Models\Center::all(),
            'activityLog' => $activityLog, 
            'documents' => [
                'specifications' => $task->getFirstMediaUrl('specifications'),
                'deliverables'   => $task->getMedia('deliverables')->map(fn($m) => [
                    'url' => $m->getUrl(),
                    'name' => $m->file_name
                ]),
            ]
        ]);
    }

    private function translateActivity($activity)
    {
        $desc = $activity->description;
        
        if ($desc === 'created') return 'Tarea creada';
        if ($desc === 'ha escrito un comentario') return 'Nuevo comentario';
        if ($desc === 'ha entregado un archivo') return 'Archivo entregado';
        
        if ($desc === 'updated') {
            // Accedemos a la columna attribute_changes
            // Dependiendo de cómo guardes los datos, puede ser un array o un objeto
            $changes = $activity->attribute_changes['attributes'] ?? [];
            
            // Filtramos campos técnicos que no queremos mostrar en el texto
            $keys = array_keys(array_diff_key($changes, [
                'updated_at' => '', 
                'status' => '', 
                'order_index' => ''
            ]));
            
            if (empty($keys)) return null; 

            $fieldTranslations = [
                'title' => 'el título',
                'description' => 'la descripción',
                'priority' => 'la prioridad',
                'due_date' => 'la fecha de entrega',
                'intern_id' => 'el responsable',
            ];

            $translatedKeys = array_map(fn($key) => $fieldTranslations[$key] ?? $key, $keys);

            $count = count($translatedKeys);
            
            if ($count === 1) {
                $textoFinal = $translatedKeys[0];
            } elseif ($count === 2) {
                $textoFinal = implode(' y ', $translatedKeys);
            } else {
                $lastElement = array_pop($translatedKeys);
                $textoFinal = implode(', ', $translatedKeys) . ' y ' . $lastElement;
            }

            return 'Se ha modificado ' . $textoFinal;
        }

        return $desc; 
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
        $user = Auth::user();
    
        DB::transaction(function () use ($validated, $task, $user) {
            // 1. Actualizamos la tarea principal.
            // Al hacer ->update(), Spatie registra automáticamente los cambios en el historial.
            $task->update([
                'title'       => $validated['title'],
                'description' => $validated['description'],
                'priority'    => $validated['priority'],
                'due_date'    => $validated['due_date'],
                'status'      => $validated['status'] ?? $task->status,
            ]);
    
            // 2. Gestionar nuevas asignaciones para otros alumnos
            $selectedInternIds = $validated['intern_ids'] ?? [];
            foreach ($selectedInternIds as $internId) {
                // Si el alumno no es el dueño actual de esta tarea, le creamos una copia
                if ($internId != $task->intern_id) {
                    $exists = Task::where('intern_id', $internId)
                                  ->where('title', $validated['title'])
                                  ->exists();
    
                    if (!$exists) {
                        $intern = Intern::find($internId);
                        
                        // Al usar Task::create, Spatie registrará automáticamente "Tarea creada" para esta nueva tarea
                        Task::create([
                            'title'       => $validated['title'],
                            'description' => $validated['description'],
                            'priority'    => $validated['priority'],
                            'due_date'    => $validated['due_date'],
                            'intern_id'   => $internId,
                            'center_id'   => $intern->center_id,
                            'creator_id'  => $user->id,
                            'status'      => $task->status,
                        ]);
                    }
                }
            }
        });
    
        return redirect()->back();
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
            'status' => 'required|in:pending,in_progress,in_review,completed,rejected',
            'new_index' => 'required|integer'
        ]);

        $oldStatus = $task->status;
        $newStatus = $request->status;
        $newIndex = $request->new_index;

        DB::transaction(function () use ($task, $oldStatus, $newStatus, $newIndex) {
            Task::where('status', $newStatus)
                ->where('order_index', '>=', $newIndex)
                ->increment('order_index');

            $task->update([
                'status' => $newStatus,
                'order_index' => $newIndex,
                'completed_at' => $newStatus === 'completed' ? now() : ($newStatus === 'pending' ? null : $task->completed_at)
            ]);

            $this->reorderTasks($oldStatus);
            if ($oldStatus !== $newStatus) {
                $this->reorderTasks($newStatus);
            }
        });

        return redirect()->back();
    }

    private function reorderTasks($status)
    {
        $tasks = Task::where('status', $status)
            ->orderBy('order_index', 'asc')
            ->orderBy('updated_at', 'desc')
            ->get();

        foreach ($tasks as $index => $t) {
            $t->order_index = $index;
            $t->saveQuietly();
        }
    }

    /**
     * Add feedback/comments to a task.
     */
    public function storeComment(Request $request, Task $task)
    {
        $request->validate([
            'body' => 'required|string',
            'deliverable' => 'nullable|file|max:10240',
        ]);

        DB::transaction(function () use ($request, $task) {
            $task->comments()->create([
                'user_id' => Auth::id(),
                'body'    => $request->body
            ]);

            activity()
            ->performedOn($task)
            ->causedBy(Auth::user())
            ->log('ha escrito un comentario');

            if ($request->hasFile('deliverable')) {
                $task->addMediaFromRequest('deliverable')->toMediaCollection('deliverables');
                
                $task->update(['status' => 'in_review']);

                activity()
                ->performedOn($task)
                ->causedBy(Auth::user())
                ->log('ha entregado un archivo');
            }
        });

        return redirect()->back()->with('success', 'Comentario añadido.');
    }


    public function storeDelivery(Request $request, Task $task)
    {
        $request->validate([
            'deliverable' => 'required|file|max:20480',
        ]);
    
        if ($request->hasFile('deliverable')) {
            $task->addMediaFromRequest('deliverable')
                 ->toMediaCollection('deliverables');
            
            $task->update(['status' => 'in_review']);

            activity()
                ->performedOn($task)
                ->causedBy(Auth::user())
                ->log('ha entregado un archivo');
        }
    
        return redirect()->back()->with('success', 'Archivo entregado correctamente.');
    }


}



