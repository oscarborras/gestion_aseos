'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, LogIn, LogOut, Settings, Users, GraduationCap, History, Clock10, Key, ShieldCheck, UserPlus, Menu, X as CloseIcon, BarChart } from 'lucide-react'
import { cn } from '@/lib/utils'

const routes = [
    {
        label: 'Pedir Turno',
        icon: Clock10,
        href: '/',
        color: 'text-amber-500',
        activeColor: 'bg-amber-500/10 text-amber-500',
        roles: ['Admin', 'Directiva', 'Public']
    },
    {
        label: 'Entregar llave',
        icon: Key,
        href: '/entregar',
        color: 'text-emerald-500',
        activeColor: 'bg-emerald-500/10 text-emerald-500',
        roles: ['Admin', 'Directiva', 'Ordenanza']
    },
    {
        label: 'Devolver llave',
        icon: LogOut,
        href: '/salida',
        color: 'text-rose-500',
        activeColor: 'bg-rose-500/10 text-rose-500',
        roles: ['Admin', 'Directiva', 'Ordenanza', 'Public']
    },
    {
        label: 'Lista de Espera',
        icon: Users,
        href: '/lista-espera',
        color: 'text-indigo-500',
        roles: ['Admin', 'Directiva', 'Profesor']
    },

    {
        label: 'Panel de Control',
        icon: LayoutDashboard,
        href: '/dashboard',
        color: 'text-indigo-500',
        activeColor: 'bg-indigo-500/10 text-indigo-500',
        roles: ['Admin', 'Directiva', 'Ordenanza']
    },
    {
        label: 'Entrada',
        icon: LogIn,
        href: '/entrada',
        roles: ['Admin', 'Directiva']
    },
    {
        label: 'Historial',
        icon: History,
        href: '/historial',
        roles: ['Admin', 'Directiva']
    },
    {
        label: 'Estadísticas',
        icon: BarChart,
        href: '/estadisticas',
        roles: ['Admin', 'Directiva']
    },
    {
        label: 'Ajustes',
        icon: Settings,
        href: '/mantenimiento',
        roles: ['Admin', 'Directiva']
    },
    {
        label: 'Usuarios',
        icon: ShieldCheck,
        href: '/mantenimiento/usuarios',
        roles: ['Admin']
    },
    {
        label: 'Importar',
        icon: UserPlus,
        href: '/alumnos/importar',
        roles: ['Admin']
    }
]

import { logout } from '@/app/login/actions'

interface SidebarProps {
    roles?: string[]
    user?: any
    isOpen?: boolean
    onClose?: () => void
}

export function Sidebar({ roles = [], user, isOpen, onClose }: SidebarProps) {
    const pathname = usePathname()

    // Si no hay roles, tratamos al usuario como 'Public'
    const userRoles = roles.length > 0 ? roles : ['Public']

    return (
        <>
            {/* Overlay para móvil */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
                    onClick={onClose}
                />
            )}

            <aside className={cn(
                "w-58 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 fixed h-full z-50 flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="h-24 flex items-center justify-between px-6 border-b border-gray-100 dark:border-gray-700 gap-3">
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm border border-indigo-100/50 dark:border-indigo-500/20">
                                < GraduationCap className="w-7 h-7" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xl font-extrabold text-slate-900 dark:text-white leading-none">Aseos</span>
                                <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-wider">Gestión Escolar</span>
                            </div>
                        </div>
                        {/* Botón cerrar para móvil */}
                        <button
                            onClick={onClose}
                            className="p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 md:hidden transition-colors"
                        >
                            <CloseIcon className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                        </button>
                    </div>
                    <nav className="mt-6 px-4 space-y-2">
                        {routes.map((route) => {
                            // Filtrar por roles
                            const hasAccess = route.roles.some(role => userRoles.includes(role))
                            if (!hasAccess) return null

                            const isActive = pathname === route.href

                            // Diseño especial para "Pedir Turno"
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

                            // Diseño especial para "Lista de Espera"
                            if (route.label === 'Lista de Espera') {
                                return (
                                    <Link
                                        href={route.href}
                                        key={route.href}
                                        className={cn(
                                            'flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold transition-all mb-2',
                                            'bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 transform hover:scale-[1.02] active:scale-[0.98]'
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
                    {user ? (
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-3 p-2 rounded-lg">
                                <div className="h-8 w-8 rounded-full bg-primary-brand/20 flex items-center justify-center text-xs font-bold text-primary-brand uppercase">
                                    {user.email ? user.email.substring(0, 2) : 'US'}
                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                        {roles.length > 0 ? userRoles.join(', ') : 'Usuario'}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
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
                                <p className="text-sm font-medium text-gray-900 dark:text-white">Acceso Personal</p>
                                <p className="text-xs text-gray-500">Entrar al sistema</p>
                            </div>
                        </Link>
                    )}
                    <span className="block text-center text-[11px] font-semibold text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-wider">v.1.3.1</span>
                </div>
            </aside>
        </>
    )
}
