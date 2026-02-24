'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { CalendarDays, Users, Download, HelpCircle } from 'lucide-react'

export default function HistorialFilters() {
    const router = useRouter()
    const searchParams = useSearchParams()

    const fecha = searchParams.get('fecha') || 'today'
    const curso = searchParams.get('curso') || ''
    const aseo = searchParams.get('aseo') || ''

    const handleFilterChange = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString())
        if (value) {
            params.set(key, value)
        } else {
            params.delete(key)
        }
        router.push(`/historial?${params.toString()}`)
    }

    return (
        <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[160px]">
                <CalendarDays className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <select
                    value={fecha}
                    onChange={(e) => handleFilterChange('fecha', e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 pl-9 pr-10 py-2 text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 focus:ring-primary-brand focus:border-primary-brand transition-all shadow-sm outline-none cursor-pointer"
                >
                    <option value="today">Hoy</option>
                    <option value="yesterday">Ayer</option>
                    <option value="this-week">Esta semana</option>
                    <option value="this-month">Este mes</option>
                    <option value="all">Todo el historial</option>
                </select>
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
