'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogIn } from 'lucide-react'
import { toast } from 'sonner'
import { login } from './actions'

export default function LoginForm() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)

        const formData = new FormData(e.currentTarget)
        const result = await login(formData)

        setLoading(false)

        if (result?.error) {
            toast.error(result.error)
        } else {
            toast.success('Sesión iniciada correctamente')

            const roles = result.roles || []
            // Si tiene el rol profesor y no es admin ni directiva, lo mandamos a la lista de espera
            const isOnlyProfesor = roles.includes('Profesor') && !roles.includes('Admin') && !roles.includes('Directiva') && !roles.includes('Ordenanza')

            if (isOnlyProfesor) {
                window.location.href = '/lista-espera'
            } else {
                window.location.href = '/mantenimiento'
            }
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Email
                </label>
                <input
                    type="email"
                    name="email"
                    required
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-brand focus:border-primary-brand outline-none transition-all dark:text-white"
                    placeholder="admin@eduaseos.local"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Contraseña
                </label>
                <input
                    type="password"
                    name="password"
                    required
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-brand focus:border-primary-brand outline-none transition-all dark:text-white"
                    placeholder="••••••••"
                />
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary-brand hover:bg-primary-light text-white px-6 py-3 rounded-lg font-semibold shadow-lg shadow-primary-brand/30 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
            >
                <LogIn className="w-5 h-5" />
                {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
        </form>
    )
}
