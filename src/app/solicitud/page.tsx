import { createClient } from '@/utils/supabase/server'
import SolicitudClient from './SolicitudClient'

export const dynamic = 'force-dynamic'

export default async function SolicitudPage() {
    const supabase = await createClient()

    // Obtener todos los alumnos ordenados
    const { data: alumnosBase } = await supabase
        .from('alumnos')
        .select('*')
        .order('alumno')

    const alumnos = alumnosBase || []
    const unidades = Array.from(new Set(alumnos.map(a => a.unidad))).sort()

    // Obtener lista de espera actual con el sexo del alumno
    const { data: waitingData } = await supabase
        .from('lista_espera')
        .select('alumno_id, alumnos(sexo)')
        .eq('estado', 'esperando')

    const waitingList = (waitingData || []).map(item => ({
        alumno_id: item.alumno_id,
        sexo: (item.alumnos as any)?.sexo
    }))

    return (
        <div className="w-full max-w-4xl mx-auto px-4 py-8 md:py-12">
            <SolicitudClient
                unidades={unidades}
                alumnos={alumnos}
                initialWaitingList={waitingList}
            />

            <footer className="mt-8 text-center text-slate-400 text-sm font-medium">
                © {new Date().getFullYear()} I.E.S Julio Verne - Sistema de Gestión de Aseos
            </footer>
        </div>
    )
}
