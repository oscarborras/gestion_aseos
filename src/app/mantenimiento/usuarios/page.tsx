import { createClient } from '@/utils/supabase/server'
import { checkPermission } from '@/lib/permissions'
import UserRolesClient from './UserRolesClient'
import { ShieldCheck } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function UsuariosPage() {
    await checkPermission('/alumnos/importar') // Solo admins pueden ver esto (usamos el mismo permiso que importar)

    const supabase = await createClient()

    // 1. Obtener todos los perfiles disponibles
    const { data: perfiles } = await supabase
        .from('perfiles')
        .select('id, nombre')
        .order('id')

    // 2. Obtener todos los usuarios de Auth (necesitamos usar el cliente de servicio o admin para listar usuarios)
    // Nota: supabase.auth.admin.listUsers() requiere el SERVICE_ROLE_KEY. 
    // Como estamos en un entorno donde queremos listar usuarios que ya están en el sistema de roles,
    // vamos a listar los que ya tienen al menos un rol o usar una consulta de registros para encontrar emails.

    // Mejor aproximación: Consultar todos los user_roles y unir con perfiles
    const { data: userRolesRaw } = await supabase
        .from('user_roles')
        .select(`
            user_id,
            perfiles (
                nombre
            )
        `)

    // También consultamos registros para encontrar IDs de usuarios que han interactuado pero quizás no tienen roles
    // Pero para simplificar, vamos a confiar en que la tabla auth.users es accesible si usamos el cliente adecuado.
    // Como NO podemos acceder a auth.users directamente vía RPC o Select común sin permisos elevados,
    // vamos a crear una vista o usar la tabla de registros para inferir usuarios, 
    // o simplemente mostrar los que ya tienen roles asignados + el admin.

    // 2. Intentar obtener usuarios. Si falla (por falta de SERVICE_ROLE_KEY), 
    // mostraremos al menos los que ya tienen roles asignados.
    let authUsers: any[] = []
    try {
        const { data } = await supabase.auth.admin.listUsers()
        if (data?.users) authUsers = data.users
    } catch (e) {
        console.error("Error listing users:", e)
    }

    // Formatear datos para el cliente
    const perfilesList = perfiles || []
    const usersMap = new Map()

    // Primero añadimos los usuarios de auth si los tenemos
    authUsers.forEach(user => {
        usersMap.set(user.id, {
            id: user.id,
            email: user.email,
            roles: []
        })
    })

    // Aseguramos que los usuarios con roles aparezcan aunque no hayamos podido listar auth
    userRolesRaw?.forEach((ur: any) => {
        if (!usersMap.has(ur.user_id)) {
            usersMap.set(ur.user_id, {
                id: ur.user_id,
                email: 'Usuario con rol (Email oculto)',
                roles: []
            })
        }
        usersMap.get(ur.user_id).roles.push(ur.perfiles.nombre)
    })

    const usersList = Array.from(usersMap.values())

    return (
        <div className="w-full max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
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
            </header>

            <UserRolesClient
                initialUsers={usersList}
                perfiles={perfilesList}
            />
        </div>
    )
}
