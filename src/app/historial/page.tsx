import { createClient } from '@/utils/supabase/server'
import { CalendarDays, Download, Smile, Meh, Frown, Users } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { formatInTimeZone } from 'date-fns-tz'

export const dynamic = 'force-dynamic'

const MADRID_TZ = 'Europe/Madrid'

export default async function HistorialPage() {
    const supabase = await createClient()

    // Calcular el rango de hoy en la zona horaria de Madrid
    const todayStr = formatInTimeZone(new Date(), MADRID_TZ, "yyyy-MM-dd'T'00:00:00.000XXX")
    const tomorrowDate = new Date()
    tomorrowDate.setDate(tomorrowDate.getDate() + 1)
    const tomorrowStr = formatInTimeZone(tomorrowDate, MADRID_TZ, "yyyy-MM-dd'T'00:00:00.000XXX")

    // Fetch finished records for today
    const { data: registros } = await supabase
        .from('registros')
        .select(`
      id,
      fecha_entrada,
      fecha_salida,
      estado_salida,
      observaciones_salida,
      aseos ( nombre ),
      alumnos ( alumno, unidad )
    `)
        .not('fecha_salida', 'is', null)
        .gte('fecha_entrada', todayStr)
        .lt('fecha_entrada', tomorrowStr)
        .order('fecha_salida', { ascending: false })

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .slice(0, 2)
            .map((n) => n[0])
            .join('')
            .toUpperCase()
    }

    const getEstadoIcon = (estado: string) => {
        switch (estado) {
            case 'Bueno':
                return <span title="Buen estado"><Smile className="w-5 h-5 text-emerald-500 mx-auto" /></span>
            case 'Regular':
                return <span title="Estado regular"><Meh className="w-5 h-5 text-amber-500 mx-auto" /></span>
            case 'Malo':
                return <span title="Mal estado"><Frown className="w-5 h-5 text-red-500 mx-auto" /></span>
            default:
                return <span className="text-slate-400">-</span>
        }
    }

    const getRandomColorClass = (id: number) => {
        // Array of Tailwind color classes for the avatar backgrounds
        const colors = [
            'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
            'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
            'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
            'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
            'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400',
        ]
        return colors[id % colors.length]
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                        Historial Sincronizado
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                        <CalendarDays className="w-4 h-4" />
                        Registro completo de actividad de los aseos
                    </p>
                </div>

                {/* Filtros Simples y Exportación */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative min-w-[160px]">
                        <CalendarDays className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <select className="w-full bg-white dark:bg-slate-800 pl-9 pr-10 py-2 text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 focus:ring-primary-brand focus:border-primary-brand transition-all shadow-sm outline-none">
                            <option value="">Filtrar por fecha</option>
                            <option value="today">Hoy</option>
                            <option value="yesterday">Ayer</option>
                            <option value="this-week">Esta semana</option>
                            <option value="this-month">Este mes</option>
                        </select>
                    </div>

                    <div className="relative min-w-[160px]">
                        <Users className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <select className="w-full bg-white dark:bg-slate-800 pl-9 pr-10 py-2 text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 focus:ring-primary-brand focus:border-primary-brand transition-all shadow-sm outline-none">
                            <option value="">Filtrar por curso</option>
                            <option value="1">1º ESO</option>
                            <option value="2">2º ESO</option>
                            <option value="3">3º ESO</option>
                            <option value="4">4º ESO</option>
                            <option value="5">1º Bach</option>
                            <option value="6">2º Bach</option>
                        </select>
                    </div>

                    <button className="bg-primary-brand text-white px-4 py-2 rounded-xl shadow-sm hover:bg-primary-light transition-colors text-sm font-medium flex items-center gap-2">
                        <Download className="w-4 h-4" />
                        Exportar CSV
                    </button>
                </div>
            </header>

            {/* Tabla */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                                <th className="px-6 py-4 border-b border-slate-100 dark:border-slate-700">Alumno</th>
                                <th className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 text-center">Curso</th>
                                <th className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 text-center">Aseo</th>
                                <th className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 text-center">Entrada</th>
                                <th className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 text-center">Salida</th>
                                <th className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 text-center">Estado</th>
                                <th className="px-6 py-4 border-b border-slate-100 dark:border-slate-700">Observaciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {registros?.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                                        No hay registros en el historial.
                                    </td>
                                </tr>
                            ) : (
                                registros?.map((registro: any) => {
                                    const entrada = new Date(registro.fecha_entrada)
                                    const salida = new Date(registro.fecha_salida)

                                    return (
                                        <tr key={registro.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs ${getRandomColorClass(registro.id)}`}>
                                                        {getInitials(registro.alumnos?.alumno || '?')}
                                                    </div>
                                                    <div className="ml-3">
                                                        <div className="text-sm font-semibold text-slate-900 dark:text-white">
                                                            {registro.alumnos?.alumno}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-slate-600 dark:text-slate-400">
                                                {registro.alumnos?.unidad}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-xs font-medium text-slate-700 dark:text-slate-300">
                                                    {registro.aseos?.nombre}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-mono text-slate-600 dark:text-slate-400">
                                                {format(entrada, 'HH:mm:ss')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-mono text-slate-600 dark:text-slate-400">
                                                {format(salida, 'HH:mm:ss')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                {getEstadoIcon(registro.estado_salida)}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 truncate max-w-[200px]" title={registro.observaciones_salida || '-'}>
                                                {registro.observaciones_salida || '-'}
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Paginación simple (Visual) */}
                {(registros?.length || 0) > 0 && (
                    <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Mostrando <span className="font-medium">1-{registros?.length}</span> de los últimos registros
                        </p>
                        <div className="flex gap-2">
                            <button disabled className="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-400 transition-colors disabled:opacity-50">Anterior</button>
                            <button disabled className="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-400 transition-colors disabled:opacity-50">Siguiente</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
