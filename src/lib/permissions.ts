import { getUserRoles } from "@/app/actions";
import { redirect } from "next/navigation";

export type Role = 'Admin' | 'Ordenanza' | 'Directiva' | 'Profesor' | 'Public' | 'Alumnado';

const PERMISSIONS: Record<string, Role[]> = {
    '/': ['Admin', 'Directiva', 'Public', 'Alumnado'],
    '/entregar': ['Admin', 'Directiva', 'Ordenanza'],
    '/salida': ['Admin', 'Directiva', 'Ordenanza', 'Public', 'Alumnado'],
    '/dashboard': ['Admin', 'Directiva', 'Ordenanza'],
    '/entrada': ['Admin', 'Directiva'],
    '/historial': ['Admin', 'Directiva', 'Ordenanza'],
    '/mantenimiento': ['Admin', 'Directiva'],
    '/alumnos/importar': ['Admin'],
    '/mantenimiento/usuarios': ['Admin'],
    '/lista-espera': ['Admin', 'Directiva', 'Profesor'],
    '/estadisticas': ['Admin', 'Directiva'],
    '/seguimiento': ['Admin', 'Directiva'],
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
