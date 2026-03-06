'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { CalendarDays, Users, Download, HelpCircle, ListFilter, Search, Smile, MessageSquare, Clock } from 'lucide-react'

export default function HistorialFilters() {
    const router = useRouter()
    const searchParams = useSearchParams()

    const fecha = searchParams.get('fecha') || 'today'
    const curso = searchParams.get('curso') || ''
    const aseo = searchParams.get('aseo') || ''
    const estado = searchParams.get('estado') || ''
    const alumno = searchParams.get('alumno') || ''
    const observaciones = searchParams.get('observaciones') || ''
    const duracion = searchParams.get('duracion') || ''
    const pageSize = searchParams.get('pageSize') || '10'

    const handleFilterChange = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString())
        if (value) {
            params.set(key, value)
        } else {
            params.delete(key)
        }
        // Al cambiar cualquier filtro (que no sea página), volver a la página 1
        if (key !== 'page') params.set('page', '1')
        router.push(`/historial?${params.toString()}`)
    }

    return (
        <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[200px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                    type="text"
                    value={alumno}
                    onChange={(e) => handleFilterChange('alumno', e.target.value)}
                    placeholder="Buscar alumno..."
                    className="w-full bg-white dark:bg-slate-800 pl-9 pr-4 py-2 text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 focus:ring-primary-brand focus:border-primary-brand transition-all shadow-sm outline-none"
                />
            </div>

            <div className="flex items-center gap-2">
                <div className="relative min-w-[160px]">
                    <CalendarDays className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <select
                        value={/^\d{4}-\d{2}-\d{2}$/.test(fecha) ? 'custom' : fecha}
                        onChange={(e) => {
                            if (e.target.value !== 'custom') {
                                handleFilterChange('fecha', e.target.value)
                            }
                        }}
                        className="w-full bg-white dark:bg-slate-800 pl-9 pr-10 py-2 text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 focus:ring-primary-brand focus:border-primary-brand transition-all shadow-sm outline-none cursor-pointer"
                    >
                        <option value="today">Hoy</option>
                        <option value="yesterday">Ayer</option>
                        <option value="this-week">Esta semana</option>
                        <option value="this-month">Este mes</option>
                        <option value="all">Todo el historial</option>
                        <option value="custom" disabled className="hidden">Fecha personalizada</option>
                    </select>
                </div>

                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${/^\d{4}-\d{2}-\d{2}$/.test(fecha)
                    ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/40 dark:border-indigo-800'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm'}`}>
                    <input
                        type="date"
                        value={/^\d{4}-\d{2}-\d{2}$/.test(fecha) ? fecha : ''}
                        onChange={(e) => handleFilterChange('fecha', e.target.value)}
                        className={`text-xs font-bold uppercase bg-transparent outline-none cursor-pointer ${/^\d{4}-\d{2}-\d{2}$/.test(fecha) ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-500'}`}
                    />
                </div>
            </div>

            <div className="relative min-w-[160px]">
                <Users className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <select
                    value={curso}
                    onChange={(e) => handleFilterChange('curso', e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 pl-9 pr-10 py-2 text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 focus:ring-primary-brand focus:border-primary-brand transition-all shadow-sm outline-none cursor-pointer"
                >
                    <option value="">Todos los cursos</option>
                    <option value="1º ESO">1º ESO</option>
                    <option value="2º ESO">2º ESO</option>
                    <option value="3º ESO">3º ESO</option>
                    <option value="4º ESO">4º ESO</option>
                    <option value="1º BACH">1º BACH</option>
                    <option value="2º BACH">2º BACH</option>
                    <option value="FPB">FPB</option>
                    <option value="Ciclos">Ciclos (ASIR/DAW/DAM)</option>
                </select>
            </div>

            <div className="relative min-w-[160px]">
                <HelpCircle className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <select
                    value={aseo}
                    onChange={(e) => handleFilterChange('aseo', e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 pl-9 pr-10 py-2 text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 focus:ring-primary-brand focus:border-primary-brand transition-all shadow-sm outline-none cursor-pointer"
                >
                    <option value="">Todos los aseos</option>
                    <option value="Planta Baja Chicas">Planta Baja Chicas</option>
                    <option value="Planta Baja Chicos">Planta Baja Chicos</option>
                    <option value="Planta Alta Chicas">Planta Alta Chicas</option>
                    <option value="Planta Alta Chicos">Planta Alta Chicos</option>
                </select>
            </div>

            <div className="relative min-w-[160px]">
                <Smile className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <select
                    value={estado}
                    onChange={(e) => handleFilterChange('estado', e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 pl-9 pr-10 py-2 text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 focus:ring-primary-brand focus:border-primary-brand transition-all shadow-sm outline-none cursor-pointer"
                >
                    <option value="">Todos los estados</option>
                    <option value="Bueno">Buen estado</option>
                    <option value="Regular">Estado regular</option>
                    <option value="Malo">Mal estado</option>
                </select>
            </div>

            <div className="relative min-w-[160px]">
                <MessageSquare className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <select
                    value={observaciones}
                    onChange={(e) => handleFilterChange('observaciones', e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 pl-9 pr-10 py-2 text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 focus:ring-primary-brand focus:border-primary-brand transition-all shadow-sm outline-none cursor-pointer"
                >
                    <option value="">Todas las notas</option>
                    <option value="con-notas">Con observaciones</option>
                    <option value="sin-notas">Sin observaciones</option>
                </select>
            </div>

            <div className="relative min-w-[160px]">
                <Clock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <select
                    value={duracion}
                    onChange={(e) => handleFilterChange('duracion', e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 pl-9 pr-10 py-2 text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 focus:ring-primary-brand focus:border-primary-brand transition-all shadow-sm outline-none cursor-pointer"
                >
                    <option value="">Cualquier duración</option>
                    <option value="5">Más de 5 min</option>
                    <option value="10">Más de 10 min</option>
                </select>
            </div>

            {/* Selector de registros por página */}
            <div className="relative min-w-[130px]">
                <ListFilter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <select
                    value={pageSize}
                    onChange={(e) => handleFilterChange('pageSize', e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 pl-9 pr-10 py-2 text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 focus:ring-primary-brand focus:border-primary-brand transition-all shadow-sm outline-none cursor-pointer"
                >
                    <option value="10">10 por página</option>
                    <option value="25">25 por página</option>
                    <option value="50">50 por página</option>
                </select>
            </div>

            <button
                onClick={() => {
                    window.print();
                }}
                className="bg-primary-brand text-white px-4 py-2 rounded-xl shadow-sm hover:bg-primary-light transition-colors text-sm font-medium flex items-center gap-2"
            >
                <Download className="w-4 h-4" />
                Exportar
            </button>
        </div>
    )
}
