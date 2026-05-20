import { Clock, RefreshCw, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';

export const STATUS_LABELS: Record<string, string> = {
    pending: 'Pendiente',
    in_progress: 'En Progreso',
    in_review: 'En Revisión',
    completed: 'Completado',
    rejected: 'Rechazado'
};

export const PRIORITY_LABELS: Record<string, string> = {
    low: 'Baja', medium: 'Media', high: 'Alta', urgent: 'Urgente'
};

export const getStatusConfig = (status: string) => {
    const configs: Record<string, any> = {
        pending: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200', borderHeader: 'border-slate-300', icon: Clock },
        in_progress: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200', borderHeader: 'border-blue-300', icon: RefreshCw },
        in_review: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200', borderHeader: 'border-purple-300', icon: AlertCircle },
        completed: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200', borderHeader: 'border-green-300', icon: CheckCircle2 },
        rejected: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200', borderHeader: 'border-red-300', icon: XCircle },
    };
    return configs[status] || configs.pending;
};

export const getPriorityStyle = (priority: string) => {
    const styles: Record<string, string> = {
        urgent: 'bg-red-100 text-red-700 border-red-200',
        high: 'bg-orange-100 text-orange-700 border-orange-200',
        medium: 'bg-blue-100 text-blue-700 border-blue-200',
        low: 'bg-gray-100 text-gray-700 border-gray-200'
    };
    return styles[priority] || styles.low;
};

export const getDueDateStyle = (dueDate: string | null) => {
    if (!dueDate) return 'text-slate-500 bg-slate-50';

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadline = new Date(dueDate);
    deadline.setHours(0, 0, 0, 0);

    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 2) {
        return 'text-red-700 bg-red-100 border-red-200';
    }
    
    return 'text-slate-600 bg-slate-50 border-slate-200';
};

export function kanbanReducer(state: any, action: any): any {
    switch (action.type) {
        case 'SET_STATE': 
            return action.payload;

        case 'MOVE_TASK': {
            const { source, destination, sourceIndex, destIndex, taskId } = action.payload;
            
            if (source === destination && sourceIndex === destIndex) return state;

            if (source === destination) {
                const newCol = [...(state[source] || [])];
                const resolvedSourceIndex = taskId
                    ? newCol.findIndex((task: any) => String(task.id) === String(taskId))
                    : sourceIndex;

                if (resolvedSourceIndex === -1) return state;

                const [movedTask] = newCol.splice(resolvedSourceIndex, 1);

                if (!movedTask) return state;

                newCol.splice(destIndex, 0, movedTask);
                
                return { 
                    ...state, 
                    [source]: newCol 
                };
            }

            const sourceCol = [...(state[source] || [])];
            const destCol = [...(state[destination] || [])];
            const resolvedSourceIndex = taskId
                ? sourceCol.findIndex((task: any) => String(task.id) === String(taskId))
                : sourceIndex;
            
            if (resolvedSourceIndex === -1) return state;

            const [movedTask] = sourceCol.splice(resolvedSourceIndex, 1);

            if (!movedTask) return state;

            const updatedTask = { ...movedTask, status: destination };
            
            destCol.splice(destIndex, 0, updatedTask);

            return { 
                ...state, 
                [source]: sourceCol, 
                [destination]: destCol 
            };
        }
        
        default: 
            return state;
    }
}
