import { createClient } from '@/utils/supabase/server'
import EntregarClient from '@/app/entregar/EntregarClient'

export const dynamic = 'force-dynamic'

import { checkPermission } from '@/lib/permissions'

export default async function EntregarPage() {
    await checkPermission('/entregar')
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

    // 2. Obtener aseos disponibles
    const { data: aseos } = await supabase
        .from('aseos')
        .select('*')
        .eq('estado_id', 1) // 1 = Disponible

    const waitingList = (waitingData || []).map((item: any) => ({
        id: item.id,
        alumno_id: item.alumno_id,
        nombre: item.alumnos.alumno,
        unidad: item.alumnos.unidad,
        sexo: item.alumnos.sexo,
        fecha: item.fecha_solicitud
    }))

    return (
        <div className="w-full max-w-6xl mx-auto px-4 py-8 md:py-12 space-y-8">
            <header>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    Gestión de Entrega de Llaves
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">
                    Asigna un aseo disponible al siguiente alumno en espera.
                </p>
            </header>

            <EntregarClient
                waitingList={waitingList}
                aseos={aseos || []}
            />
        </div>
    )
}
