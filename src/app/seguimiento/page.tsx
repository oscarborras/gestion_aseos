import { checkPermission } from '@/lib/permissions'
import SeguimientoClient from './SeguimientoClient'
import { getAllAlumnos, getAlumnosSeguimiento } from '../actions'

export const dynamic = 'force-dynamic'

export default async function SeguimientoPage() {
    await checkPermission('/seguimiento')

    const [allAlumnos, currentSeguimiento] = await Promise.all([
        getAllAlumnos(),
        getAlumnosSeguimiento()
    ])

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            <header className="border-b border-slate-200 dark:border-slate-800 pb-6">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                    Seguimiento de Alumnos
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">
                    Gestiona la lista de alumnos bajo observación especial de forma profesional.
                </p>
            </header>

            <SeguimientoClient 
                allAlumnos={allAlumnos} 
                initialSeguimiento={currentSeguimiento} 
            />
        </div>
    )
}
