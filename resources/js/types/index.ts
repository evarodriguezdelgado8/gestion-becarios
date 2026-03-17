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
}

export interface Intern {
    id: number;
    name: string;
    last_name: string;
    email: string;
    status: 'active' | 'finished';
    start_date: string;
}