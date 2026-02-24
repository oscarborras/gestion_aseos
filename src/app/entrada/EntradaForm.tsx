'use client'

import { useState } from 'react'
import { registrarEntrada } from '../actions'
import { CheckCircle, School, Info, GraduationCap } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

type Aseo = any
type Curso = any
type Alumno = any

export default function EntradaForm({
    aseos,
    unidades,
    alumnos,
    defaultAseo
}: {
    aseos: any[],
    unidades: string[],
    alumnos: any[],
    defaultAseo?: number
}) {
    const router = useRouter()
    const [selectedCurso, setSelectedCurso] = useState<string>('')
    const [selectedAlumnos, setSelectedAlumnos] = useState<string[]>([])
    const [selectedAseo, setSelectedAseo] = useState<number | undefined>(defaultAseo)
    const [loading, setLoading] = useState(false)

    // Filtrar alumnos por unidad seleccionada
    const alumnosFiltrados = selectedCurso
        ? alumnos.filter(a => a.unidad === selectedCurso)
        : alumnos

    const handleAlumnoToggle = (id: string) => {
        setSelectedAlumnos(prev =>
            prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
        )
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        if (!selectedAseo) {
            toast.error('Debe seleccionar un aseo')
            return
        }
        if (selectedAlumnos.length === 0) {
            toast.error('Debe seleccionar al menos un alumno')
            return
        }

        setLoading(true)
        const formData = new FormData(e.currentTarget)
        formData.append('aseo_id', selectedAseo.toString())
        formData.append('alumnos', JSON.stringify(selectedAlumnos))

        const result = await registrarEntrada(formData)
        setLoading(false)

        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success('Entrada registrada correctamente')
            router.push('/')
        }
    }

    const libresCount = aseos.filter(a => a.estado_id === 1).length
    const totalCount = aseos.length

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            {/* 1. Selección de Alumnos */}
            <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">1. Seleccionar Alumnos</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 relative md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                            Filtrar por Unidad / Curso
                        </label>
                        <div className="relative">
                            <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
                            <select
                                className="w-full pl-10 pr-10 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-brand focus:border-primary-brand outline-none transition-all dark:text-white"
                                value={selectedCurso}
                                onChange={(e) => setSelectedCurso(e.target.value)}
                            >
                                <option value="">Todas las unidades</option>
                                {unidades.map(u => (
                                    <option key={u} value={u}>{u}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Lista de Alumnos */}
                <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl max-h-48 overflow-y-auto p-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {alumnosFiltrados.length === 0 ? (
                        <p className="p-4 text-sm text-slate-500 col-span-2 text-center">No hay alumnos en este curso.</p>
                    ) : (
                        alumnosFiltrados.map(alumno => {
                            const checked = selectedAlumnos.includes(alumno.id)
                            return (
                                <label
                                    key={alumno.id}
                                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${checked ? 'border-primary-brand bg-primary-brand/5' : 'border-transparent hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                                >
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 text-primary-brand rounded border-slate-300 focus:ring-primary-brand dark:border-slate-600 dark:bg-slate-700"
                                        checked={checked}
                                        onChange={() => handleAlumnoToggle(alumno.id)}
                                    />
                                    <div className="flex flex-col">
                                        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{alumno.alumno}</span>
                                        <span className="text-xs text-slate-500">{alumno.unidad}</span>
                                    </div>
                                </label>
                            )
                        })
                    )}
                </div>
            </div>

            {/* 2. Selección de Aseos */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">2. Seleccionar Aseo</h3>
                    <span className="text-xs font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                        {libresCount}/{totalCount} Disponible
                    </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {aseos.filter(a => a.estado_id === 1).length === 0 ? (
                        <div className="col-span-full py-12 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                            <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">block</span>
                            <p className="text-slate-500 font-medium">No hay aseos disponibles en este momento</p>
                        </div>
                    ) : (
                        aseos.filter(a => a.estado_id === 1).map(aseo => {
                            const checked = selectedAseo === aseo.id;

                            return (
                                <label
                                    key={aseo.id}
                                    className={`relative flex flex-col items-center justify-center p-4 border-2 rounded-xl transition-all h-full ${checked
                                            ? 'border-primary-brand bg-primary-brand/5'
                                            : 'border-slate-100 dark:border-slate-700 cursor-pointer hover:border-primary-brand/50 bg-white dark:bg-slate-800'
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        name="aseo"
                                        className="sr-only"
                                        checked={checked}
                                        onChange={() => setSelectedAseo(aseo.id)}
                                    />
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 transition-colors ${checked ? 'bg-primary-brand text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'
                                        }`}>
                                        <span className={`material-symbols-outlined text-2xl ${!checked && aseo.nombre.toLowerCase().includes('chicos') ? 'text-blue-500' : ''}`}>
                                            {aseo.nombre.toLowerCase().includes('chicas') ? 'woman' :
                                                aseo.nombre.toLowerCase().includes('chicos') ? 'man' : 'person'}
                                        </span>
                                    </div>
                                    <span className={`font-semibold text-center ${checked ? 'text-primary-brand' : 'text-slate-700 dark:text-slate-200'}`}>
                                        {aseo.nombre}
                                    </span>
                                    <span className="text-xs text-emerald-600 font-medium mt-1 flex items-center">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1"></span> Disponible
                                    </span>
                                </label>
                            )
                        })
                    )}
                </div>
            </div>

            {/* 3. Observaciones */}
            <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="observaciones">
                    Observaciones de Entrada <span className="text-slate-400 font-normal">(Opcional)</span>
                </label>
                <textarea
                    name="observaciones"
                    id="observaciones"
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-brand focus:border-primary-brand outline-none transition-all placeholder:text-slate-400 dark:text-white resize-none"
                    placeholder="Cualquier nota específica sobre esta entrada..."
                ></textarea>
            </div>

            {/* Acciones */}
            <div className="pt-4 flex flex-col md:flex-row gap-4 items-center justify-end">
                <button
                    type="button"
                    onClick={() => router.push('/')}
                    className="w-full md:w-auto px-6 py-3 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white font-medium transition-colors"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full md:w-auto bg-primary-brand hover:bg-primary-light text-white px-8 py-3 rounded-lg font-semibold shadow-lg shadow-primary-brand/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:pointer-events-none"
                >
                    <CheckCircle className="w-5 h-5" />
                    {loading ? 'Registrando...' : 'Confirmar y Registrar'}
                </button>
            </div>
        </form>
    )
}
