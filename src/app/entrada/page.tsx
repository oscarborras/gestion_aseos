import { createClient } from '@/utils/supabase/server'
import EntradaForm from '@/app/entrada/EntradaForm'

export const dynamic = 'force-dynamic'

export default async function EntradaPage({
    searchParams,
}: {
    searchParams: { aseo?: string }
}) {
    const supabase = await createClient()

    // Fetch only necessary data
    // Obtener todos los alumnos ordenados
    const { data: alumnosBase } = await supabase.from('alumnos').select('*').order('alumno')
    const { data: aseosBase } = await supabase.from('aseos').select('*').order('id')

    // Extraer unidades únicas para el filtro
    const alumnos = alumnosBase || []
    const unidades = Array.from(new Set(alumnos.map(a => a.unidad))).sort()
    const aseos = aseosBase || []

    // Si viene preseleccionado desde el dashboard
    const defaultAseo = searchParams.aseo ? parseInt(searchParams.aseo) : undefined

    return (
        <div className="w-full max-w-3xl mx-auto bg-white dark:bg-slate-900 shadow-xl rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800 transition-colors duration-300 animate-in fade-in slide-in-from-bottom-4">
            <header className="bg-primary-brand/5 px-8 py-6 border-b border-primary-brand/10 flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        Registrar Entrada al Aseo
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
                        Seleccione curso, alumnos y el aseo de destino.
                    </p>
                </div>
            </header>

            <div className="p-8">
                <EntradaForm aseos={aseos} unidades={unidades} alumnos={alumnos} defaultAseo={defaultAseo} />
            </div>
        </div>
    )
}
