import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import LoginForm from './LoginForm'

export default async function LoginPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
        redirect('/mantenimiento')
    }

    return (
        <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4 animate-in fade-in slide-in-from-bottom-4">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-800">
                <div className="p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Acceso Administrador</h1>
                        <p className="text-sm text-slate-500 mt-2">Introduce tus credenciales para continuar</p>
                    </div>
                    <LoginForm />
                </div>
            </div>
        </div>
    )
}
