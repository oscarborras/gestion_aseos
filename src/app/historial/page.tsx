import { createClient } from '@/utils/supabase/server'
import { CalendarDays, Smile, Meh, Frown } from 'lucide-react'
import { format, startOfDay, endOfDay, startOfWeek, startOfMonth, addDays } from 'date-fns'
import { toZonedTime, formatInTimeZone } from 'date-fns-tz'
import HistorialFilters from './HistorialFilters'
import { Suspense } from 'react'

export const dynamic = 'force-dynamic'

const MADRID_TZ = 'Europe/Madrid'

export default async function HistorialPage(props: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const searchParams = await props.searchParams
    const supabase = await createClient()

    const fechaFilter = (searchParams.fecha as string) || 'today'
    const cursoFilter = (searchParams.curso as string) || ''
    const aseoFilter = (searchParams.aseo as string) || ''

    // Determinar el rango de fechas para la consulta
    let dateGte: string | null = null
    let dateLt: string | null = null

    const now = new Date()
    const zonedNow = toZonedTime(now, MADRID_TZ)

    if (fechaFilter === 'today') {
        const start = startOfDay(zonedNow)
        dateGte = formatInTimeZone(start, MADRID_TZ, "yyyy-MM-dd'T'00:00:00.000XXX")
        dateLt = formatInTimeZone(addDays(start, 1), MADRID_TZ, "yyyy-MM-dd'T'00:00:00.000XXX")
    } else if (fechaFilter === 'yesterday') {
        const yesterday = addDays(startOfDay(zonedNow), -1)
        dateGte = formatInTimeZone(yesterday, MADRID_TZ, "yyyy-MM-dd'T'00:00:00.000XXX")
        dateLt = formatInTimeZone(addDays(yesterday, 1), MADRID_TZ, "yyyy-MM-dd'T'00:00:00.000XXX")
    } else if (fechaFilter === 'this-week') {
        const weekStart = startOfWeek(zonedNow, { weekStartsOn: 1 })
        dateGte = formatInTimeZone(weekStart, MADRID_TZ, "yyyy-MM-dd'T'00:00:00.000XXX")
    } else if (fechaFilter === 'this-month') {
        const monthStart = startOfMonth(zonedNow)
        dateGte = formatInTimeZone(monthStart, MADRID_TZ, "yyyy-MM-dd'T'00:00:00.000XXX")
    }

    // Usar !inner si queremos que el filtro por curso afecte a los resultados de registros
    const selectQuery = `
        id,
        fecha_entrada,
        fecha_salida,
        estado_salida,
        observaciones_salida,
        aseos${aseoFilter ? '!inner' : ''} ( nombre ),
        alumnos${cursoFilter ? '!inner' : ''} ( alumno, unidad )
    `

    let query = supabase
        .from('registros')
        .select(selectQuery)
        .not('fecha_salida', 'is', null)

    if (dateGte) query = query.gte('fecha_entrada', dateGte)
    if (dateLt) query = query.lt('fecha_entrada', dateLt)

    if (cursoFilter) {
        // En Supabase, filtrar por una columna de una tabla unida se hace con 'tabla.columna'
        query = query.ilike('alumnos.unidad', `%${cursoFilter}%`)
    }

    if (aseoFilter) {
        query = query.eq('aseos.nombre', aseoFilter)
    }

    const { data: registros, error } = await query.order('fecha_salida', { ascending: false })

    if (error) {
        console.error('Error fetching historial:', error)
    }

    const getInitials = (name: string) => {
        return name
            .split(/[ ,]+/) // Split by space or comma
            .filter(n => n.length > 0 && !n.endsWith('.'))
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

    const getRandomColorClass = (id: any) => {
        const colors = [
            'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
            'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
            'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
            'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
            'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400',
        ]
        let index = 0
        if (typeof id === 'number') {
            index = id
        } else if (typeof id === 'string') {
            index = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
        }
        return colors[index % colors.length]
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                        Historial de Registros
                    </h1>
                    <div className="text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap items-center gap-2 text-sm">
                        <CalendarDays className="w-4 h-4" />
                        <span>Mostrando:</span>
                        <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg text-primary-brand font-bold">
                            {fechaFilter === 'today' ? 'Hoy' :
                                fechaFilter === 'yesterday' ? 'Ayer' :
                                    fechaFilter === 'this-week' ? 'Esta semana' :
                                        fechaFilter === 'this-month' ? 'Este mes' : 'Todo'}
                        </span>
                        {cursoFilter && (
                            <>
                                <span>en</span>
                                <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg text-primary-brand font-bold">{cursoFilter}</span>
                            </>
                        )}
                    </div>
                </div>

                <Suspense fallback={<div className="h-10 w-64 bg-slate-100 animate-pulse rounded-xl" />}>
                    <HistorialFilters />
                </Suspense>
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
                                <th className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 text-center">Duración</th>
                                <th className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 text-center">Estado</th>
                                <th className="px-6 py-4 border-b border-slate-100 dark:border-slate-700">Observaciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {!registros || registros.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <CalendarDays className="w-10 h-10 opacity-20" />
                                            <p>No se encontraron registros con los filtros seleccionados.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                registros.map((registro: any) => {
                                    const entrada = new Date(registro.fecha_entrada)
                                    const salida = new Date(registro.fecha_salida)

                                    // Calcular duración en minutos y segundos
                                    const diffMs = salida.getTime() - entrada.getTime()
                                    const diffSecs = Math.floor(diffMs / 1000)
                                    const mins = Math.floor(diffSecs / 60)
                                    const secs = diffSecs % 60
                                    const duracion = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`

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
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-primary-brand dark:text-primary-light">
                                                {duracion}
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

                {/* Resumen */}
                {(registros?.length || 0) > 0 && (
                    <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Mostrando <span className="font-medium text-slate-900 dark:text-white">{registros?.length}</span> registros en total
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
