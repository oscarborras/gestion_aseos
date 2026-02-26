'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { Menu } from 'lucide-react'
import { GraduationCap } from 'lucide-react'

export default function LayoutClient({
    children,
    user,
    roles
}: {
    children: React.ReactNode
    user: any
    roles: string[]
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false)

    return (
        <div className="flex min-h-screen">
            <Sidebar
                roles={roles}
                user={user}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />

            <div className="flex-1 flex flex-col md:ml-64">
                {/* Cabecera Móvil */}
                <header className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between sticky top-0 z-30">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                            <GraduationCap className="w-6 h-6" />
                        </div>
                        <span className="text-lg font-black text-slate-900 dark:text-white leading-none">Aseos</span>
                    </div>
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400 active:scale-95 transition-all"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                </header>

                <main className="flex-1 p-4 lg:p-8 flex flex-col">
                    <div className="max-w-7xl mx-auto space-y-4 flex-1 w-full">
                        {children}
                    </div>
                    <footer className="mt-8 pb-4 text-center text-slate-400 text-sm font-medium">
                        © {new Date().getFullYear()} - I.E.S. Julio Verne - Sistema de Gestión de Aseos
                    </footer>
                </main>
            </div>
        </div>
    )
}
