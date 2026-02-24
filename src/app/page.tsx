import { createClient } from '@/utils/supabase/server'
import SolicitudClient from '@/components/solicitud/SolicitudClient'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const supabase = await createClient()

  // Obtener todos los alumnos ordenados
  const { data: alumnosBase } = await supabase
    .from('alumnos')
    .select('*')
    .order('alumno')

  const alumnos = alumnosBase || []
  const unidades = Array.from(new Set(alumnos.map(a => a.unidad))).sort()

  // Obtener lista de espera actual con el estado para filtrar y estadísticas
  const { data: waitingData } = await supabase
    .from('lista_espera')
    .select('alumno_id, estado, alumnos(sexo)')
    .in('estado', ['esperando', 'notificado', 'en_uso'])

  // Obtener alumnos que actualmente están en un aseo (registros sin salida)
  const { data: enAseoData } = await supabase
    .from('registros')
    .select('alumno_id')
    .is('fecha_salida', null)

  const activeWaiting = waitingData || []
  const idsExcluir = new Set([
    ...activeWaiting.map(w => w.alumno_id),
    ...(enAseoData || []).map(r => r.alumno_id)
  ])

  const waitingListStats = activeWaiting
    .filter(w => w.estado === 'esperando')
    .map(item => ({
      alumno_id: item.alumno_id,
      sexo: (item.alumnos as any)?.sexo
    }))

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 md:py-12">
      <SolicitudClient
        unidades={unidades}
        alumnos={alumnos}
        initialWaitingList={waitingListStats}
        excludeIds={Array.from(idsExcluir)}
      />

      <footer className="mt-8 text-center text-slate-400 text-sm font-medium">
        © {new Date().getFullYear()} I.E.S Julio Verne - Sistema de Gestión de Aseos
      </footer>
    </div>
  )
}
