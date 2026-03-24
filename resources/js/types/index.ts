export type * from './auth';
export type * from './navigation';
export type * from './ui';


export interface BreadcrumbItem {
    title: string;
    href: string | any;
}

export interface Center {
    id: number;
    nif: string;
    name: string;
    address: string;
    phone: string;
    email: string;
    web?: string; 
    
    contact_name: string;
    contact_role: string;
    contact_phone: string;
    contact_email: string;
   
    created_at?: string;
    updated_at?: string;
}

export interface CenterFormData {
    nif: string;
    name: string;
    address: string;
    phone: string;
    email: string;
    web: string;
    contact_name: string;
    contact_role: string;
    contact_phone: string;
    contact_email: string;
}

export interface Pagination<T> {
    data: T[];
    current_page: number;
    last_page: number;
    prev_page_url: string | null;
    next_page_url: string | null;
    total: number;
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
}

export interface Intern {
    id: number;
    name: string;
    last_name: string;
    dni: string;
    email: string;
    phone: string;
    address: string;
    academic_cycle: string;
    status: 'active' | 'finished' | 'abandoned' | '';
    completed_hours: number;
    total_hours: number;
    center_id: number;
    center?: {
        id: number;
        name: string;
    };
    academic_tutor: string;
    start_date: string;
    end_date: string;
}


export interface InternFormData {
    name: string;
    last_name: string;
    dni: string;
    email: string;
    phone: string;
    address: string;
    center_id: string | number;
    academic_cycle: string;
    academic_tutor: string;
    start_date: string;
    end_date: string;
    total_hours: number;
    completed_hours: number;
    status: 'active' | 'finished' | 'abandoned' | '';
    document_dni: File | null;
    document_convenio: File | null;
}
