import { createClient } from '@/utils/supabase/server'
import { BarChart, CheckCircle, Clock10, LogIn, GraduationCap } from 'lucide-react'
import Link from 'next/link'
import CurrentTime from '@/components/dashboard/CurrentTime'
import ElapsedTimer from '@/components/dashboard/ElapsedTimer'
import { formatInTimeZone } from 'date-fns-tz'

const MADRID_TZ = 'Europe/Madrid'

import { checkPermission } from '@/lib/permissions'
import { getUserRoles } from '@/app/actions'

export default async function DashboardPage() {
    await checkPermission('/dashboard')
    const supabase = await createClient()
    const userRoles = await getUserRoles()
    const canManage = userRoles.includes('Admin') || userRoles.includes('Directiva')

    // 1. Obtener aseos
    const { data: aseosBase } = await supabase.from('aseos').select('*, estados(nombre)')

    // 2. Obtener registros activos (alumnos en el aseo ahora)
    const { data: registrosActivos } = await supabase
        .from('registros')
        .select(`
            aseo_id,
            alumnos (
                alumno,
                unidad
            )
        `)
        .is('fecha_salida', null)

    // Agrupar alumnos por aseo
    const alumnosPorAseo: Record<number, { nombre: string, unidad: string }[]> = {}
    registrosActivos?.forEach((reg: any) => {
        if (!alumnosPorAseo[reg.aseo_id]) alumnosPorAseo[reg.aseo_id] = []
        alumnosPorAseo[reg.aseo_id].push({
            nombre: reg.alumnos?.alumno || 'Desconocido',
            unidad: reg.alumnos?.unidad || 'Sin curso'
        })
    })

    // Calcular el rango de hoy en la zona horaria de Madrid
    const todayStr = formatInTimeZone(new Date(), MADRID_TZ, "yyyy-MM-dd'T'00:00:00.000XXX")
    const tomorrowDate = new Date()
    tomorrowDate.setDate(tomorrowDate.getDate() + 1)
    const tomorrowStr = formatInTimeZone(tomorrowDate, MADRID_TZ, "yyyy-MM-dd'T'00:00:00.000XXX")

    const { count: usosTotalesCount } = await supabase
        .from('registros')
        .select('*', { count: 'exact', head: true })
        .gte('fecha_entrada', todayStr)
        .lt('fecha_entrada', tomorrowStr)

    const usosTotales = usosTotalesCount || 0

    // Enriquecer la lista de aseos con los datos de los registros reales (más fiable que las columnas denormalizadas)
    const aseosList = (aseosBase || []).map(aseo => ({
        ...aseo,
        estudiantesReales: alumnosPorAseo[aseo.id] || []
    }))

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
                                        <div className="mb-auto overflow-y-auto max-h-[140px] pr-2 scrollbar-thin">
                                            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase mb-3">Estudiantes</p>
                                            <div className="space-y-4">
                                                {aseo.estudiantesReales.map((estudiante: any, idx: number) => (
                                                    <div key={idx} className="border-l-2 border-primary-brand/30 pl-3">
                                                        <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
                                                            {estudiante.nombre}
                                                        </p>
                                                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{estudiante.unidad}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-red-500 bg-red-50 dark:bg-red-900/10 p-3 rounded-xl mt-4 shrink-0">
                                            <Clock10 className="w-4 h-4" />
                                            <ElapsedTimer startTime={aseo.ultimo_cambio} />
                                            <span className="text-[10px] ml-auto font-medium text-red-400 uppercase tracking-wider"></span>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="flex-grow flex flex-col items-center justify-center">
                                            <div className={`h-16 w-16 rounded-full flex items-center justify-center ${isMantenimiento ? 'bg-orange-50 dark:bg-orange-900/20' : 'bg-emerald-50 dark:bg-emerald-900/20'}`}>
                                                {isMantenimiento ? (
                                                    <span className="material-symbols-outlined text-orange-500 text-3xl">block</span>
                                                ) : (
                                                    <CheckCircle className="text-emerald-500 w-8 h-8" />
                                                )}
                                            </div>
                                            {isMantenimiento && (
                                                <p className="text-xs font-bold text-orange-500 uppercase tracking-widest mt-4">No disponible</p>
                                            )}
                                        </div>
                                        {!isMantenimiento && canManage && (
                                            <Link href={`/entrada?aseo=${aseo.id}`} prefetch={false}>
                                                <button className="mt-6 w-full py-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-xl text-sm font-bold transition-colors hover:bg-emerald-100 flex items-center justify-center gap-2">
                                                    <LogIn className="w-5 h-5" />
                                                    Entrada Rápida
                                                </button>
                                            </Link>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    )
                })}
            </section>

            {canManage && (
                <div className="fixed bottom-8 right-8 z-10 flex flex-col gap-4 items-end">
                    <Link href="/">
                        <button className="bg-amber-500 hover:bg-amber-600 text-white shadow-lg hover:shadow-amber-500/20 transition-all duration-300 rounded-full px-6 py-3 flex items-center gap-2 text-base font-bold transform hover:scale-105">
                            <Clock10 className="w-5 h-5" />
                            Pedir Turno
                        </button>
                    </Link>
                    <Link href="/entrada">
                        <button className="bg-primary-brand hover:bg-primary-light text-white shadow-xl hover:shadow-2xl transition-all duration-300 rounded-full px-8 py-4 flex items-center gap-3 text-lg font-bold transform hover:scale-105">
                            <LogIn className="w-6 h-6" />
                            Registrar Entrada
                        </button>
                    </Link>
                </div>
            )}

        </div>
    )
}
