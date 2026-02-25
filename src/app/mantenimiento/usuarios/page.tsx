import { createClient } from '@/utils/supabase/server'
import { checkPermission } from '@/lib/permissions'
import UserRolesClient from './UserRolesClient'
import { ShieldCheck } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function UsuariosPage() {
    // Solo el perfil Admin puede acceder a esta página
    await checkPermission('/mantenimiento/usuarios')

    const supabase = await createClient()

    // 1. Obtener todos los perfiles disponibles
    const { data: perfiles } = await supabase
        .from('perfiles')
        .select('id, nombre')
        .order('id')

    // 2. Obtener todos los usuarios vía función RPC segura (solo funciona si eres Admin)
    const { data: authUsers, error: usersError } = await supabase
        .rpc('get_all_users')

    if (usersError) {
        console.error('Error fetching users via RPC:', usersError)
    }

    // 3. Obtener roles asignados de todos los usuarios
    const { data: userRolesRaw } = await supabase
        .from('user_roles')
        .select('user_id, perfil_id, perfiles(nombre)')

    // 4. Construir el mapa de usuarios con sus roles
    const perfilesList = perfiles || []
    const usersMap = new Map<string, { id: string, email: string, roles: string[] }>()

        // Primero añadir todos los usuarios de auth
        ; (authUsers || []).forEach((user: any) => {
            usersMap.set(user.id, {
                id: user.id,
                email: user.email || 'Sin email',
                roles: []
            })
        })

        // Combinar con sus roles actuales
        ; (userRolesRaw || []).forEach((ur: any) => {
            if (!usersMap.has(ur.user_id)) {
                usersMap.set(ur.user_id, {
                    id: ur.user_id,
                    email: 'UUID: ' + ur.user_id.substring(0, 8) + '...',
                    roles: []
                })
            }
            if (ur.perfiles?.nombre) {
                usersMap.get(ur.user_id)!.roles.push(ur.perfiles.nombre)
            }
        })

    const usersList = Array.from(usersMap.values())

    return (
        <div className="w-full max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
                <div>
                    <div className="flex items-center gap-2 text-primary-brand mb-1">
                        <ShieldCheck className="w-5 h-5" />
                        <span className="text-sm font-bold uppercase tracking-wider">Seguridad y Accesos</span>
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                        Gestión de Usuarios
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">
                        Administre los permisos y niveles de acceso de las cuentas registradas.
                    </p>
                </div>
                <div className="flex items-center gap-3 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                    <ShieldCheck className="w-5 h-5 text-primary-brand" />
                    <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
                        {usersList.length} usuario{usersList.length !== 1 ? 's' : ''} registrado{usersList.length !== 1 ? 's' : ''}
                    </span>
                </div>
            </header>

            {usersList.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-12 text-center border border-slate-100 dark:border-slate-700">
                    <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 font-medium">No se pudieron cargar los usuarios.</p>
                    <p className="text-slate-400 text-sm mt-1">Verifica que el servidor Supabase esté en funcionamiento.</p>
                </div>
            ) : (
                <UserRolesClient
                    initialUsers={usersList}
                    perfiles={perfilesList}
                />
            )}
        </div>
    )
}
