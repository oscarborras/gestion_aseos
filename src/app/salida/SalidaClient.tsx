'use client'

import { useState } from 'react'
import { CheckCircle, Timer, Info, Edit, Frown, Meh, Smile, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { registrarSalida } from '../actions'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

type Registro = any

export default function SalidaClient({ registros }: { registros: Registro[] }) {
    const router = useRouter()
    const [selectedRegistro, setSelectedRegistro] = useState<Registro | null>(null)
    const [loading, setLoading] = useState(false)

    const handleSelect = (registro: Registro) => {
        setSelectedRegistro(registro)
        // Deslizar scroll si estamos en movil
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        if (!selectedRegistro) return

        setLoading(true)
        const formData = new FormData(e.currentTarget)
        formData.append('registro_id', selectedRegistro.id.toString())
        formData.append('aseo_id', selectedRegistro.aseo_id.toString())

        const result = await registrarSalida(formData)
        setLoading(false)

        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success('Salida registrada correctamente')
            setSelectedRegistro(null) // Reseteamos
        }
    }

    return (
        <>
            <section className="flex flex-col w-full md:w-5/12 lg:w-4/12 h-full gap-4 shrink-0">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Aseos Ocupados</h2>
                    <span className="text-xs font-bold px-2 py-1 bg-primary-brand/10 text-primary-brand rounded-lg uppercase tracking-wider">
                        En vivo
                    </span>
                </div>

                <div className="flex-grow overflow-y-auto space-y-4 pr-2 pb-24 md:pb-0">
                    {registros.length === 0 ? (
                        <div className="bg-slate-50 dark:bg-slate-800 p-8 rounded-xl text-center border border-dashed border-slate-200 dark:border-slate-700">
                            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                            <p className="text-slate-500 font-medium">Todos los aseos están libres</p>
                        </div>
                    ) : (
                        registros.map(registro => {
                            const isSelected = selectedRegistro?.id === registro.id
                            const entradaTime = new Date(registro.fecha_entrada)

                            return (
                                <div
                                    key={registro.id}
                                    onClick={() => handleSelect(registro)}
                                    className={`group relative rounded-xl p-5 shadow-sm border-2 cursor-pointer transition-all duration-200 transform hover:scale-[1.01] ${isSelected
                                        ? 'bg-primary-brand/5 border-primary-brand dark:bg-primary-brand/10'
                                        : 'bg-white dark:bg-slate-800 border-transparent hover:border-slate-200 dark:hover:border-slate-600'
                                        }`}
                                >
                                    <div className="absolute top-4 right-4">
                                        <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-lg">
                                            <Timer className="w-4 h-4" />
                                            <span className="text-xs font-bold font-mono">
                                                {formatDistanceToNow(entradaTime, { locale: es })}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${isSelected ? 'bg-primary-brand text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}>
                                            <span className={`material-symbols-outlined text-3xl ${!isSelected && registro.aseos?.nombre.toLowerCase().includes('chicos') ? 'text-blue-500' : ''}`}>
                                                {registro.aseos?.nombre.toLowerCase().includes('chicas') ? 'woman' :
                                                    registro.aseos?.nombre.toLowerCase().includes('chicos') ? 'man' : 'person'}
                                            </span>
                                        </div>
                                        <div>
                                            <p className={`text-xs font-bold tracking-wide uppercase mb-1 ${isSelected ? 'text-primary-brand' : 'text-slate-500'}`}>
                                                {registro.aseos?.nombre}
                                            </p>
                                            <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                                                {registro.alumnos?.alumno}
                                            </h3>
                                            <p className="text-sm text-slate-500 mt-1">
                                                {registro.alumnos?.unidad}
                                            </p>
                                        </div>
                                    </div>
                                    <div className={`mt-4 pt-4 border-t flex items-center justify-between transition-opacity ${isSelected ? 'border-primary-brand/20 opacity-100' : 'border-slate-100 dark:border-slate-700 opacity-50 group-hover:opacity-100'}`}>
                                        <span className="text-xs text-slate-400">Entrada: {entradaTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        <span className={`text-sm font-semibold ${isSelected ? 'text-primary-brand underline' : 'text-primary-brand'}`}>
                                            {isSelected ? 'Seleccionado' : 'Seleccionar →'}
                                        </span>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </section>

            {/* Formulario de salida para el alumno seleccionado */}
            <section className="relative w-full md:w-7/12 lg:w-8/12 bg-white dark:bg-slate-800 rounded-2xl shadow-xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-700 mb-24 md:mb-0">
                {!selectedRegistro ? (
                    <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400">
                        <Timer className="w-16 h-16 opacity-20 mb-4" />
                        <p className="text-lg font-medium">Selecciona un registro de la lista<br />para procesar su salida.</p>
                    </div>
                ) : (
                    <>
                        <div className="h-24 bg-gradient-to-r from-primary-brand to-primary-light relative flex-shrink-0">
                        </div>

                        <div className="flex-grow flex flex-col px-8 md:px-12 -mt-12 relative z-10 overflow-y-auto pb-8">
                            <div className="flex items-end justify-between mb-8">
                                <div>
                                    <div className="h-20 w-20 rounded-2xl bg-white dark:bg-slate-700 shadow-lg p-1.5 flex items-center justify-center mb-4">
                                        <div className="h-full w-full bg-slate-100 dark:bg-slate-600 rounded-xl flex items-center justify-center text-3xl font-bold text-primary-brand uppercase">
                                            {selectedRegistro.alumnos?.alumno.slice(0, 2)}
                                        </div>
                                    </div>
                                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                                        {selectedRegistro.alumnos?.alumno}
                                    </h2>
                                    <p className="text-slate-500 dark:text-slate-400">
                                        Saliendo de: <span className="font-bold text-primary-brand">{selectedRegistro.aseos?.nombre}</span>
                                    </p>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl">
                                {/* Opciones de estado */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 uppercase tracking-wide">
                                        Estado del Aseo al Salir
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <label className="cursor-pointer group">
                                            <input type="radio" name="estado" value="Bueno" defaultChecked className="peer sr-only" />
                                            <div className="flex flex-col items-center p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 hover:bg-white peer-checked:border-emerald-500 peer-checked:bg-emerald-50 dark:peer-checked:bg-emerald-900/10 transition-all">
                                                <Smile className="w-8 h-8 text-slate-400 group-hover:text-emerald-500 peer-checked:text-emerald-600 mb-2 transition-colors" />
                                                <span className="font-bold text-slate-600 dark:text-slate-300 peer-checked:text-emerald-700 dark:peer-checked:text-emerald-400">Bueno</span>
                                            </div>
                                        </label>

                                        <label className="cursor-pointer group">
                                            <input type="radio" name="estado" value="Regular" className="peer sr-only" />
                                            <div className="flex flex-col items-center p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 hover:bg-white peer-checked:border-yellow-500 peer-checked:bg-yellow-50 dark:peer-checked:bg-yellow-900/10 transition-all">
                                                <Meh className="w-8 h-8 text-slate-400 group-hover:text-yellow-500 peer-checked:text-yellow-600 mb-2 transition-colors" />
                                                <span className="font-bold text-slate-600 dark:text-slate-300 peer-checked:text-yellow-700 dark:peer-checked:text-yellow-400">Regular</span>
                                            </div>
                                        </label>

                                        <label className="cursor-pointer group">
                                            <input type="radio" name="estado" value="Malo" className="peer sr-only" />
                                            <div className="flex flex-col items-center p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 hover:bg-white peer-checked:border-red-500 peer-checked:bg-red-50 dark:peer-checked:bg-red-900/10 transition-all">
                                                <Frown className="w-8 h-8 text-slate-400 group-hover:text-red-500 peer-checked:text-red-600 mb-2 transition-colors" />
                                                <span className="font-bold text-slate-600 dark:text-slate-300 peer-checked:text-red-700 dark:peer-checked:text-red-400">Malo</span>
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                {/* Observaciones */}
                                <div>
                                    <label htmlFor="observaciones" className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">
                                        Observaciones de Salida
                                    </label>
                                    <div className="relative">
                                        <Edit className="absolute top-3 left-3 text-slate-400 w-5 h-5 pointer-events-none" />
                                        <textarea
                                            name="observaciones"
                                            id="observaciones"
                                            rows={3}
                                            className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-brand outline-none resize-none transition-shadow placeholder-slate-400"
                                            placeholder="¿Algún problema? (ej. falta papel, suelo mojado...)"
                                        ></textarea>
                                    </div>
                                </div>

                                {/* Acciones */}
                                <div className="pt-4 flex items-center justify-end gap-4 border-t border-slate-100 dark:border-slate-700 mt-auto">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedRegistro(null)}
                                        className="px-6 py-3 rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700 font-bold transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="px-8 py-3 bg-primary-brand hover:bg-primary-light text-white rounded-xl shadow-lg shadow-primary-brand/30 font-bold flex items-center gap-2 transform active:scale-95 transition-all disabled:opacity-70"
                                    >
                                        <CheckCircle className="w-5 h-5" />
                                        {loading ? 'Procesando...' : 'Confirmar Salida'}
                                    </button>
                                </div>
                            </form>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 px-8 py-4 flex justify-between items-center text-xs text-slate-400 shrink-0">
                            <div className="flex items-center gap-2">
                                <Info className="w-4 h-4" />
                                <span>Esta acción no puede deshacerse. El aseo {selectedRegistro.aseos?.nombre} se actualizará.</span>
                            </div>
                            <div>ID: #{selectedRegistro.id}</div>
                        </div>
                    </>
                )}
            </section>
        </>
    )
}
