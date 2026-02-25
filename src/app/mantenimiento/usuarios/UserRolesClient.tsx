'use client'

import { useState } from 'react'
import { updateUserRoles } from '@/app/actions'
import { toast } from 'sonner'
import { Shield, User as UserIcon, Check, Loader2 } from 'lucide-react'

interface User {
    id: string
    email?: string
    roles: string[]
}

interface Perfil {
    id: number
    nombre: string
}

export default function UserRolesClient({
    initialUsers,
    perfiles
}: {
    initialUsers: User[],
    perfiles: Perfil[]
}) {
    const [loading, setLoading] = useState<string | null>(null)
    const [users, setUsers] = useState(initialUsers)

    const handleToggleRole = async (userId: string, perfilId: number, currentRoles: string[], roleName: string) => {
        setLoading(userId)

        let newRoleIds: number[] = []

        // Encontrar los IDs de los roles actuales
        const currentRoleNames = currentRoles
        const isRemoving = currentRoleNames.includes(roleName)

        if (isRemoving) {
            // Quitar el rol
            const updatedNames = currentRoleNames.filter(name => name !== roleName)
            newRoleIds = perfiles
                .filter(p => updatedNames.includes(p.nombre))
                .map(p => p.id)
        } else {
            // Añadir el rol
            const updatedNames = [...currentRoleNames, roleName]
            newRoleIds = perfiles
                .filter(p => updatedNames.includes(p.nombre))
                .map(p => p.id)
        }

        const res = await updateUserRoles(userId, newRoleIds)

        if (res.success) {
            toast.success('Roles actualizados correctamente')
            // Actualizar estado local
            setUsers(prev => prev.map(u => {
                if (u.id === userId) {
                    const updatedRoles = isRemoving
                        ? u.roles.filter(r => r !== roleName)
                        : [...u.roles, roleName]
                    return { ...u, roles: updatedRoles }
                }
                return u
            }))
        } else {
            toast.error(res.error || 'Error al actualizar roles')
        }

        setLoading(null)
    }

    return (
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                            <th className="px-8 py-5">Usuario</th>
                            {perfiles.map(perfil => (
                                <th key={perfil.id} className="px-4 py-5 text-center">{perfil.nombre}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {users.map((user) => (
                            <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                                <td className="px-8 py-5">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500">
                                            <UserIcon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 dark:text-white">{user.email}</p>
                                            <p className="text-xs text-slate-500 font-medium">ID: {user.id.substring(0, 8)}...</p>
                                        </div>
                                    </div>
                                </td>
                                {perfiles.map(perfil => {
                                    const hasRole = user.roles.includes(perfil.nombre)
                                    const isUserLoading = loading === user.id

                                    return (
                                        <td key={perfil.id} className="px-4 py-5 text-center">
                                            <button
                                                disabled={isUserLoading}
                                                onClick={() => handleToggleRole(user.id, perfil.id, user.roles, perfil.nombre)}
                                                className={`
                                                    mx-auto h-10 w-10 rounded-2xl flex items-center justify-center transition-all
                                                    ${hasRole
                                                        ? 'bg-primary-brand text-white shadow-lg shadow-primary-brand/20'
                                                        : 'bg-slate-100 dark:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                                                    }
                                                    ${isUserLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer transform hover:scale-110 active:scale-95'}
                                                `}
                                            >
                                                {isUserLoading ? (
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                ) : hasRole ? (
                                                    <Check className="w-5 h-5 stroke-[3]" />
                                                ) : (
                                                    <div className="w-2 h-2 rounded-full bg-current opacity-20" />
                                                )}
                                            </button>
                                        </td>
                                    )
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="p-8 bg-slate-50/50 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-2xl text-amber-600 dark:text-amber-400">
                        <Shield className="w-6 h-6" />
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-900 dark:text-white">Panel de Seguridad</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Haga clic en los iconos para asignar o retirar perfiles. Los cambios se aplican de forma inmediata y afectarán a la visibilidad de los módulos para el usuario seleccionado.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
