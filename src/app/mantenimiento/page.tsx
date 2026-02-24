import { createClient } from '@/utils/supabase/server'
import MantenimientoClient from './MantenimientoClient'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function MantenimientoPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Fetch all aseos
    const { data: aseos } = await supabase
        .from('aseos')
        .select('*')
        .order('id')

    return (
        <div className="w-full max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <header className="mb-10">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Configuración y Mantenimiento</h2>
                <p className="text-slate-500 dark:text-slate-400">
                    Gestione el estado de disponibilidad y mantenimiento de los sanitarios del centro educativo.
                </p>
            </header>

            <MantenimientoClient aseos={aseos || []} />
        </div>
    )
}
