'use client'

import { useState } from 'react'
import { Info, Wrench, RotateCw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { toggleMantenimiento } from '../actions'

type Aseo = any

export default function MantenimientoClient({ aseos }: { aseos: Aseo[] }) {
    const router = useRouter()
    const [loadingId, setLoadingId] = useState<number | null>(null)
    const [isRefreshing, setIsRefreshing] = useState(false)

    const libres = aseos.filter((a) => a.estado_id === 1).length
    const enMantenimiento = aseos.filter((a) => a.estado_id === 3).length

    const handleToggle = async (aseoId: number, currentEstadoId: number) => {
        // Si esta ocupado (2), avisamos o simplemente lo pasamos a mantenimiento (3)?
        // Pasarlo a mantenimiento liberará a la fuerza.
        const isCurrentlyMantenimiento = currentEstadoId === 3
        const newIsMantenimiento = !isCurrentlyMantenimiento

        setLoadingId(aseoId)
        const result = await toggleMantenimiento(aseoId, newIsMantenimiento)
        setLoadingId(null)

        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success(newIsMantenimiento ? 'Aseo en Mantenimiento' : 'Aseo Disponible')
            router.refresh()
        }
    }

    const handleRefresh = () => {
        setIsRefreshing(true)
        router.refresh()
        setTimeout(() => setIsRefreshing(false), 500)
    }

    return (
        <>
            <div className="bg-primary-brand/5 border border-primary-brand/20 rounded-xl p-4 mb-8 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Info className="w-5 h-5 text-primary-brand" />
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                        Actualmente hay <span className="font-bold text-primary-brand">{libres} aseos disponibles</span> y{' '}
                        <span className="font-bold text-orange-600">{enMantenimiento} en mantenimiento</span>.
                    </p>
                </div>
                <button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="text-xs font-bold text-primary-brand uppercase tracking-wider hover:underline flex items-center gap-1 disabled:opacity-50"
                >
                    <RotateCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                    Refrescar estado
                </button>
            </div>

            <div className="space-y-12">
                {/* Sección Chicas */}
                <div>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-xl">woman</span>
                        Aseos de Chicas
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {aseos.filter(a => a.nombre.toLowerCase().includes('chicas')).map((aseo) => {
                            const isMantenimiento = aseo.estado_id === 3
                            const isOcupado = aseo.estado_id === 2
                            const isLoading = loadingId === aseo.id

                            return (
                                <AseoCard
                                    key={aseo.id}
                                    aseo={aseo}
                                    isMantenimiento={isMantenimiento}
                                    isOcupado={isOcupado}
                                    isLoading={isLoading}
                                    handleToggle={handleToggle}
                                />
                            )
                        })}
                    </div>
                </div>

                {/* Sección Chicos */}
                <div>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-xl text-blue-500">man</span>
                        Aseos de Chicos
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {aseos.filter(a => a.nombre.toLowerCase().includes('chicos')).map((aseo) => {
                            const isMantenimiento = aseo.estado_id === 3
                            const isOcupado = aseo.estado_id === 2
                            const isLoading = loadingId === aseo.id

                            return (
                                <AseoCard
                                    key={aseo.id}
                                    aseo={aseo}
                                    isMantenimiento={isMantenimiento}
                                    isOcupado={isOcupado}
                                    isLoading={isLoading}
                                    handleToggle={handleToggle}
                                />
                            )
                        })}
                    </div>
                </div>
            </div>
        </>
    )
}

function AseoCard({ aseo, isMantenimiento, isOcupado, isLoading, handleToggle }: any) {
    return (
        <div
            className={`bg-white dark:bg-slate-900 rounded-xl p-6 transition-all ring-1 relative overflow-hidden ${isMantenimiento
                ? 'border-orange-500/50 ring-orange-500/10 shadow-sm'
                : 'border-slate-200 dark:border-slate-800 ring-transparent hover:shadow-md'
                }`}
        >
            {isLoading && (
                <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm z-10 flex items-center justify-center">
                    <RotateCw className="w-6 h-6 animate-spin text-primary-brand" />
                </div>
            )}

            <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${aseo.nombre.toLowerCase().includes('chicas')
                        ? 'bg-pink-50 dark:bg-pink-900/20 text-pink-500'
                        : 'bg-blue-50 dark:bg-blue-900/20 text-blue-500'
                        }`}>
                        <span className="material-symbols-outlined text-2xl">
                            {aseo.nombre.toLowerCase().includes('chicas') ? 'woman' : 'man'}
                        </span>
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900 dark:text-white leading-tight">{aseo.nombre}</h3>
                    </div>
                </div>

                {isMantenimiento ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border border-orange-200 dark:border-orange-800/50">
                        Mantenimiento
                    </span>
                ) : isOcupado ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                        Ocupado ({aseo.ocupado_por?.split(',').length || 1})
                    </span>
                ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
                        Disponible
                    </span>
                )}
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {isMantenimiento ? 'Desactivar Mantenimiento' : 'Activar Mantenimiento'}
                    </span>

                    <button
                        type="button"
                        onClick={() => handleToggle(aseo.id, aseo.estado_id)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent focus:outline-none focus:ring-2 focus:ring-primary-brand focus:ring-offset-2 transition-colors duration-200 ease-in-out ${isMantenimiento ? 'bg-orange-500' : 'bg-slate-200 dark:bg-slate-700'
                            }`}
                        role="switch"
                        aria-checked={isMantenimiento}
                    >
                        <span
                            aria-hidden="true"
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isMantenimiento ? 'translate-x-5' : 'translate-x-0'
                                }`}
                        />
                    </button>
                </div>

                {isMantenimiento && (
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800/50 mt-4 animate-in slide-in-from-top-2 opacity-100 fade-in duration-200">
                        <div className="flex items-center gap-2 text-xs font-medium text-orange-600 dark:text-orange-400 mb-2">
                            <Wrench className="w-3 h-3" />
                            Aseo bloqueado para alumnos
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
