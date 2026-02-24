import { createClient } from '@/utils/supabase/server'
import SalidaClient from '@/app/salida/SalidaClient'

export const dynamic = 'force-dynamic'

export default async function SalidaPage() {
    const supabase = await createClient()

    // Fetch only necessary data: active sessions (registros without fecha_salida)
    const { data: registrosActivos } = await supabase
        .from('registros')
        .select(`
      id,
      fecha_entrada,
      aseo_id,
      aseos ( nombre ),
      alumnos ( id, alumno, unidad )
    `)
        .is('fecha_salida', null)
        .order('fecha_entrada', { ascending: false })

    return (
        <div className="flex-grow flex flex-col md:flex-row w-full gap-6 md:gap-8 overflow-hidden h-[calc(100vh-8rem)] animate-in fade-in slide-in-from-bottom-4">
            <SalidaClient registros={registrosActivos || []} />
        </div>
    )
}
