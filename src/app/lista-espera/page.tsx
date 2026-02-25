import { createClient } from '@/utils/supabase/server'
import ListaEsperaViewClient from './ListaEsperaViewClient'
import { checkPermission } from '@/lib/permissions'
import { Users } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ListaEsperaPage() {
    // Verificar permisos para Profesores, Admin y Directiva
    await checkPermission('/lista-espera')

    const supabase = await createClient()

    // 1. Obtener lista de espera actual (solo 'esperando') con datos de alumnos
    const { data: waitingData } = await supabase
        .from('lista_espera')
        .select(`
            id,
            alumno_id,
            fecha_solicitud,
            estado,
            alumnos (
                alumno,
                unidad,
                sexo
            )
        `)
        .eq('estado', 'esperando')
        .order('fecha_solicitud', { ascending: true })

    const waitingList = (waitingData || []).map((item: any) => ({
        id: item.id,
        alumno_id: item.alumno_id,
        nombre: item.alumnos?.alumno || 'Desconocido',
        unidad: item.alumnos?.unidad || 'Sin Curso',
        sexo: item.alumnos?.sexo || 'N',
        fecha: item.fecha_solicitud
    }))

    return (
        <div className="w-full max-w-6xl mx-auto px-4 py-8 md:py-12 space-y-8">
            <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
                            <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                            Consulta de Espera
                        </h1>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">
                        Visualización en tiempo real de la demanda de aseos por parte del alumnado.
                    </p>
                </div>
                <div className="bg-white dark:bg-slate-900 px-4 py-2 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Directo</span>
                </div>
            </header>

            <ListaEsperaViewClient
                waitingList={waitingList}
            />
        </div>
    )
}
