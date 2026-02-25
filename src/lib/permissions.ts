import { getUserRoles } from "@/app/actions";
import { redirect } from "next/navigation";

export type Role = 'Admin' | 'Ordenanza' | 'Directiva' | 'Profesor' | 'Public';

const PERMISSIONS: Record<string, Role[]> = {
    '/': ['Admin', 'Directiva', 'Public'],
    '/entregar': ['Admin', 'Directiva', 'Ordenanza'],
    '/salida': ['Admin', 'Directiva', 'Ordenanza', 'Public'],
    '/dashboard': ['Admin', 'Directiva', 'Ordenanza'],
    '/entrada': ['Admin', 'Directiva'],
    '/historial': ['Admin', 'Directiva'],
    '/mantenimiento': ['Admin', 'Directiva'],
    '/alumnos/importar': ['Admin'],
    '/mantenimiento/usuarios': ['Admin'],
    '/lista-espera': ['Admin', 'Directiva', 'Profesor'],
};

export async function checkPermission(path: keyof typeof PERMISSIONS) {
    const roles = await getUserRoles();
    const userRoles = roles.length > 0 ? roles : ['Public'];

    // Admin can access everything
    if (userRoles.includes('Admin')) return;

    const allowedRoles = PERMISSIONS[path];
    if (!allowedRoles) return; // Path not restricted or unknown

    const hasPermission = allowedRoles.some(role => userRoles.includes(role as Role));

    if (!hasPermission) {
        redirect('/');
    }
}
