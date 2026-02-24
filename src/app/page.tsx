import { createClient } from '@/utils/supabase/server'
import { BarChart, CheckCircle, Clock10, LogIn, GraduationCap } from 'lucide-react'
import Link from 'next/link'
import CurrentTime from '@/components/dashboard/CurrentTime'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Fetch data
  const { data: aseosBase } = await supabase.from('aseos').select('*, estados(nombre)')

  // Calcular el rango de hoy (desde las 00:00:00 hasta las 23:59:59)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const { count: usosTotalesCount } = await supabase
    .from('registros')
    .select('*', { count: 'exact', head: true })
    .gte('fecha_entrada', today.toISOString())
    .lt('fecha_entrada', tomorrow.toISOString())

  const usosTotales = usosTotalesCount || 0
  const aseosList = aseosBase || []

  const chicasLibres = aseosList.filter(a => a.nombre.toLowerCase().includes('chica') && a.estado_id === 1).length
  const totalChicas = aseosList.filter(a => a.nombre.toLowerCase().includes('chica')).length
  const chicosLibres = aseosList.filter(a => a.nombre.toLowerCase().includes('chico') && a.estado_id === 1).length
  const totalChicos = aseosList.filter(a => a.nombre.toLowerCase().includes('chico')).length

  return (
    <div className="space-y-8 animate-in fade-in zoom-in duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white uppercase leading-tight">Panel de control</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-primary-brand" />
            <span className="font-medium">Gestión de Aseos Escolares</span>
          </p>
        </div>
        <CurrentTime />
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border-l-4 border-primary-brand flex items-center justify-between transition-transform hover:scale-105">
          <div>
            <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Usos totales hoy</p>
            <p className="text-4xl font-bold text-gray-900 dark:text-white">{usosTotales}</p>
          </div>
          <div className="h-12 w-12 rounded-full bg-primary-brand/10 flex items-center justify-center text-primary-brand">
            <BarChart className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border-l-4 border-emerald-500 flex items-center justify-between transition-transform hover:scale-105">
          <div>
            <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Aseos Libres Chicas</p>
            <div className="flex items-baseline gap-2">
              <p className="text-4xl font-bold text-gray-900 dark:text-white">{chicasLibres}</p>
              <p className="text-xl text-gray-300 dark:text-gray-600">/ {totalChicas || 2}</p>
            </div>
          </div>
          <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-500">
            <span className="material-symbols-outlined text-3xl">woman</span>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border-l-4 border-emerald-500 flex items-center justify-between transition-transform hover:scale-105">
          <div>
            <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Aseos Libres Chicos</p>
            <div className="flex items-baseline gap-2">
              <p className="text-4xl font-bold text-gray-900 dark:text-white">{chicosLibres}</p>
              <p className="text-xl text-gray-300 dark:text-gray-600">/ {totalChicos || 2}</p>
            </div>
          </div>
          <div className="h-12 w-12 rounded-full bg-primary-brand/10 flex items-center justify-center text-primary-brand">
            <span className="material-symbols-outlined text-3xl">man</span>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {aseosList.map((aseo) => {
          const isOcupado = aseo.estado_id === 2;
          const isMantenimiento = aseo.estado_id === 3;

          let borderColor = 'border-emerald-500';
          let secondaryColor = 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500';
          let badgeText = 'Libre';

          if (isOcupado) {
            borderColor = 'bg-red-500';
            secondaryColor = 'bg-red-50 dark:bg-red-900/20 text-red-500';
            badgeText = 'Ocupado';
          } else if (isMantenimiento) {
            borderColor = 'bg-yellow-500';
            secondaryColor = 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-500';
            badgeText = 'Mantenimiento';
          }

          return (
            <div key={aseo.id} className="relative group bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col h-80 transition-all hover:shadow-lg">
              <div className={`h-2 w-full ${borderColor === 'bg-red-500' ? borderColor : 'bg-' + borderColor.split('-')[1] + '-500'}`}></div>
              {isOcupado && <div className="absolute top-6 right-6 h-3 w-3 rounded-full bg-red-400 animate-pulse opacity-50"></div>}

              <div className="p-6 flex-grow flex flex-col">
                <div className="mb-6 text-left">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">{aseo.nombre}</h3>
                  <div className="mt-2">
                    <span className={`px-3 py-1 rounded-lg ${secondaryColor} text-[10px] font-bold tracking-widest uppercase flex items-center gap-1.5`}>
                      <span className="material-symbols-outlined text-sm">
                        {aseo.nombre.toLowerCase().includes('chicas') ? 'woman' :
                          aseo.nombre.toLowerCase().includes('chicos') ? 'man' : 'person'}
                      </span>
                      {badgeText}
                    </span>
                  </div>
                </div>

                {isOcupado ? (
                  <>
                    <div className="mb-auto">
                      <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase mb-1">Estudiantes</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white line-clamp-2">
                        {aseo.ocupado_por || 'Desconocido'}
                      </p>
                      <p className="text-sm text-gray-400 dark:text-gray-500">{aseo.curso_alumno || 'Sin curso'}</p>
                    </div>
                    <div className="flex items-center gap-2 text-red-500 bg-red-50 dark:bg-red-900/10 p-3 rounded-xl mt-4">
                      <Clock10 className="w-4 h-4" />
                      <span className="text-sm font-bold">Activo</span>
                      <span className="text-[10px] ml-auto font-medium text-red-400">Transcurrido</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex-grow flex items-center justify-center">
                      <div className="h-16 w-16 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                        <CheckCircle className="text-emerald-500 w-8 h-8" />
                      </div>
                    </div>
                    <Link href={`/entrada?aseo=${aseo.id}`} prefetch={false}>
                      <button className="mt-6 w-full py-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-xl text-sm font-bold transition-colors hover:bg-emerald-100 flex items-center justify-center gap-2">
                        <LogIn className="w-5 h-5" />
                        Entrada Rápida
                      </button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </section>

      <div className="fixed bottom-8 right-8 z-10">
        <Link href="/entrada">
          <button className="bg-primary-brand hover:bg-primary-light text-white shadow-xl hover:shadow-2xl transition-all duration-300 rounded-full px-8 py-4 flex items-center gap-3 text-lg font-bold transform hover:scale-105">
            <LogIn className="w-6 h-6" />
            Registrar Entrada
          </button>
        </Link>
      </div>

      <footer className="mt-12 text-center border-t border-gray-100 dark:border-gray-800 pt-8 pb-4">
        <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center justify-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          Sistema Operativo • Última sincr: Ahora mismo
        </p>
      </footer>
    </div>
  )
}
