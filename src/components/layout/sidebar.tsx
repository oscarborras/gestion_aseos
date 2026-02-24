'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, LogIn, LogOut, Settings, Users, GraduationCap, History, Clock10, Key } from 'lucide-react'
import { cn } from '@/lib/utils'

const routes = [
    {
        label: 'Pedir Turno',
        icon: Clock10,
        href: '/solicitud',
        color: 'text-amber-500',
        activeColor: 'bg-amber-500/10 text-amber-500',
    },
    {
        label: 'Entregar llave',
        icon: Key,
        href: '/entregar',
        color: 'text-emerald-500',
        activeColor: 'bg-emerald-500/10 text-emerald-500',
    },
    {
        label: 'Devolver llave',
        icon: LogOut,
        href: '/salida',
        color: 'text-rose-500',
        activeColor: 'bg-rose-500/10 text-rose-500',
    },
    {
        label: 'Panel de Control',
        icon: LayoutDashboard,
        href: '/',
        color: 'text-primary-brand',
        activeColor: 'bg-primary-brand/10 text-primary-brand',
    },
    {
        label: 'Entrada',
        icon: LogIn,
        href: '/entrada',
    },
    {
        label: 'Historial',
        icon: History,
        href: '/historial',
    },
    {
        label: 'Ajustes',
        icon: Settings,
        href: '/mantenimiento',
        adminOnly: true
    },
    {
        label: 'Importar',
        icon: Users,
        href: '/alumnos/importar',
        adminOnly: true
    }
]

import { logout } from '@/app/login/actions'

export function Sidebar({ isAdmin = false }: { isAdmin?: boolean }) {
    const pathname = usePathname()

    return (
        <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 fixed h-full z-30 flex flex-col justify-between hidden md:flex">
            <div>
                <div className="h-24 flex items-center px-6 border-b border-gray-100 dark:border-gray-700 gap-3">
                    <div className="h-12 w-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm border border-indigo-100/50 dark:border-indigo-500/20">
                        <GraduationCap className="w-7 h-7" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xl font-extrabold text-slate-900 dark:text-white leading-none">Aseos</span>
                        <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-wider">Gestión Escolar</span>
                    </div>
                </div>
                <nav className="mt-6 px-4 space-y-2">
                    {routes.map((route) => {
                        // Ocultar si es solo para admin y el usuario no lo es
                        if (route.adminOnly && !isAdmin) return null

                        const isActive = pathname === route.href

                        // Diseño especial para "Pedir Turno" (similar al botón del dashboard)
                        if (route.label === 'Pedir Turno') {
                            return (
                                <Link
                                    href={route.href}
                                    key={route.href}
                                    className={cn(
                                        'flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold transition-all mb-2 mt-2',
                                        'bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20 transform hover:scale-[1.02] active:scale-[0.98]'
                                    )}
                                >
                                    <route.icon className="w-5 h-5" />
                                    <span>{route.label}</span>
                                </Link>
                            )
                        }

                        // Diseño especial para "Entregar llave"
                        if (route.label === 'Entregar llave') {
                            return (
                                <Link
                                    href={route.href}
                                    key={route.href}
                                    className={cn(
                                        'flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold transition-all mb-2',
                                        'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 transform hover:scale-[1.02] active:scale-[0.98]'
                                    )}
                                >
                                    <route.icon className="w-5 h-5" />
                                    <span>{route.label}</span>
                                </Link>
                            )
                        }

                        // Diseño especial para "Devolver llave"
                        if (route.label === 'Devolver llave') {
                            return (
                                <Link
                                    href={route.href}
                                    key={route.href}
                                    className={cn(
                                        'flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold transition-all mb-4',
                                        'bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/20 transform hover:scale-[1.02] active:scale-[0.98]'
                                    )}
                                >
                                    <route.icon className="w-5 h-5" />
                                    <span>{route.label}</span>
                                </Link>
                            )
                        }

                        return (
                            <Link
                                href={route.href}
                                key={route.href}
                                className={cn(
                                    'flex items-center gap-3 px-3 py-3 rounded-lg font-medium transition-colors',
                                    isActive
                                        ? route.activeColor || 'bg-primary-brand/10 text-primary-brand'
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-white'
                                )}
                            >
                                <route.icon className={cn('w-5 h-5', !isActive && 'text-gray-400')} />
                                <span>{route.label}</span>
                            </Link>
                        )
                    })}
                </nav>
            </div>

            <div className="p-4 border-t border-gray-100 dark:border-gray-700">
                {isAdmin ? (
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3 p-2 rounded-lg">
                            <div className="h-8 w-8 rounded-full bg-primary-brand/20 flex items-center justify-center text-xs font-bold text-primary-brand">
                                AD
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">Admin</p>
                                <p className="text-xs text-gray-500">Sesión Activa</p>
                            </div>
                        </div>
                        <form action={logout}>
                            <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors font-medium">
                                <LogOut className="w-4 h-4" />
                                Cerrar Sesión
                            </button>
                        </form>
                    </div>
                ) : (
                    <Link href="/login" className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors group">
                        <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-500 group-hover:bg-primary-brand/10 group-hover:text-primary-brand transition-colors">
                            <LogIn className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">Login</p>
                            <p className="text-xs text-gray-500">Acceso Admin</p>
                        </div>
                    </Link>
                )}
            </div>
        </aside>
    )
}
