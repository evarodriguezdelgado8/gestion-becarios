export type User = {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    photo_url?: string; // Añadimos esto para que coincida con tu lógica de guardado
    email_verified_at: string | null;
    two_factor_enabled?: boolean;
    roles?: string[];   // Lo dejamos listo para el sistema de roles
    created_at: string;
    updated_at: string;
    [key: string]: any; // Cambiamos 'unknown' por 'any' para evitar errores de asignación
};

export type Auth = {
    user: User;
};

export type TwoFactorSetupData = {
    svg: string;
    url: string;
};

export type TwoFactorSecretKey = {
    secretKey: string;
};
