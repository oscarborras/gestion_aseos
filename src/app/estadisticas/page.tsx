import { createClient } from '@/utils/supabase/server'
import { checkPermission } from '@/lib/permissions'
import StatsClient from './StatsClient'

export const dynamic = 'force-dynamic'

export default async function EstadisticasPage() {
    await checkPermission('/estadisticas')
    const supabase = await createClient()

    // Obtener todos los registros con datos de alumnos y aseos
    // Limitamos a los últimos 30 días para las estadísticas generales o traemos todo lo necesario
    const { data: registros, error } = await supabase
        .from('registros')
        .select(`
            id,
            fecha_entrada,
            fecha_salida,
            estado_salida,
            alumno_id,
            aseo_id,
            alumnos (
                alumno,
                unidad,
                sexo
            ),
            aseos (
                nombre
            )
        `)
        .not('fecha_salida', 'is', null)
        .order('fecha_entrada', { ascending: false })

    if (error) {
        console.error('Error fetching stats:', error)
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header className="border-b border-slate-200 dark:border-slate-800 pb-6">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                    Estadísticas de Uso
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">
                    Análisis detallado de la utilización de los aseos por parte del alumnado.
                </p>
            </header>

            <StatsClient registros={registros || []} />
        </div>
    )
}
