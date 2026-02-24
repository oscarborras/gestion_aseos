'use client'

import { useState } from 'react'
import { solicitarUsoAseo } from '../actions'
import { GraduationCap, Search, CheckCircle, ChevronRight, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export default function SolicitudClient({
    unidades,
    alumnos,
    initialWaitingList = []
}: {
    unidades: string[],
    alumnos: any[],
    initialWaitingList?: { alumno_id: string, sexo: string }[]
}) {
    const router = useRouter()
    const [step, setStep] = useState(1) // 1: Botón, 2: Selección
    const [selectedCurso, setSelectedCurso] = useState<string>('')
    const [searchQuery, setSearchQuery] = useState<string>('')
    const [selectedAlumnos, setSelectedAlumnos] = useState<string[]>([])
    const [loading, setLoading] = useState(false)

    // Determinar el sexo del alumno seleccionado (si hay uno)
    const selectedAlumnoData = selectedAlumnos.length > 0 ? alumnos.find(a => a.id === selectedAlumnos[0]) : null
    const userGender = selectedAlumnoData?.sexo?.toUpperCase()

    // Estadísticas globales de la lista de espera
    const totalBoys = initialWaitingList.filter(item => item.sexo?.toUpperCase() !== 'M').length
    const totalGirls = initialWaitingList.filter(item => item.sexo?.toUpperCase() === 'M').length

    // Filtrar la lista de espera por el sexo del usuario actual
    const sameGenderWaiting = initialWaitingList.filter(item => item.sexo?.toUpperCase() === userGender)
    const sameGenderCount = sameGenderWaiting.length

    // Badge Dinámico que se mostrará en lugar del texto estático
    const SolicitudHeaderBadge = () => (
        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-4 py-2 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm transition-all animate-in fade-in zoom-in">
            <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${userGender ? 'bg-indigo-500' : 'bg-amber-500'}`} />
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                {userGender
                    ? `${sameGenderCount} ${sameGenderCount === 1 ? (userGender === 'M' ? 'chica' : 'chico') : (userGender === 'M' ? 'chicas' : 'chicos')} en espera`
                    : `${totalBoys} ${totalBoys === 1 ? 'chico' : 'chicos'} y ${totalGirls} ${totalGirls === 1 ? 'chica' : 'chicas'} en espera`}
            </span>
        </div>
    )

    // Función para normalizar texto (quitar acentos y pasar a minúsculas)
    const normalize = (text: string) =>
        text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")

    const alumnosFiltrados = alumnos.filter(a => {
        const matchesCurso = !selectedCurso || a.unidad === selectedCurso
        let matchesSearch = true
        if (searchQuery) {
            const normalizedSearch = normalize(searchQuery)
            const normalizedName = normalize(a.alumno)
            const words = normalizedName.split(/\s+/)
            matchesSearch = words.some(word => word.startsWith(normalizedSearch))
        }
        return matchesCurso && matchesSearch
    })

    const handleAlumnoToggle = (id: string) => {
        setSelectedAlumnos([id])
    }

    const handleSubmit = async () => {
        if (selectedAlumnos.length === 0) {
            toast.error('Debe seleccionar su nombre')
            return
        }

        setLoading(true)
        const result = await solicitarUsoAseo(selectedAlumnos)
        setLoading(false)

        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success('Solicitud enviada a la lista de espera')
            router.push('/')
        }
    }

    const renderContent = () => {
        if (step === 1) {
            return (
                <div className="flex flex-col items-center justify-center py-12 space-y-8 animate-in fade-in zoom-in-95 duration-500">
                    <div className="w-24 h-24 bg-primary-brand/10 rounded-full flex items-center justify-center">
                        <UserPlus className="w-12 h-12 text-primary-brand" />
                    </div>
                    <div className="text-center space-y-2 px-4">
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">¿Necesitas usar el aseo?</h2>
                        <p className="text-slate-500 dark:text-slate-400">Pulsa el botón para identificarte y entrar en la lista de espera</p>
                    </div>
                    <button
                        onClick={() => setStep(2)}
                        className="group relative w-full max-w-md h-32 bg-primary-brand hover:bg-primary-light text-white rounded-3xl shadow-2xl shadow-primary-brand/30 transition-all active:scale-95 flex items-center justify-center gap-4 overflow-hidden"
                    >
                        <span className="text-2xl font-bold">Solicitar uso de aseo</span>
                        <ChevronRight className="w-8 h-8 transition-transform group-hover:translate-x-2" />
                    </button>
                </div>
            )
        }

        return (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setStep(1)}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                        >
                            <ChevronRight className="w-6 h-6 rotate-180 text-slate-400" />
                        </button>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">¿Quién eres?</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                Filtrar por Unidad / Curso
                            </label>
                            <div className="relative">
                                <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
                                <select
                                    className="w-full pl-10 pr-10 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-brand focus:border-primary-brand outline-none transition-all dark:text-white"
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

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                Buscar por Nombre
                            </label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
                                <input
                                    type="text"
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-brand focus:border-primary-brand outline-none transition-all dark:text-white placeholder:text-slate-400"
                                    placeholder="Escribe tu nombre..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl max-h-72 overflow-y-auto p-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {alumnosFiltrados.length === 0 ? (
                            <div className="p-8 text-sm text-slate-500 col-span-2 text-center flex flex-col items-center gap-2">
                                <Search className="w-8 h-8 text-slate-300" />
                                No se han encontrado alumnos con ese nombre o curso.
                            </div>
                        ) : (
                            alumnosFiltrados.map(alumno => {
                                const checked = selectedAlumnos.includes(alumno.id)
                                return (
                                    <label
                                        key={alumno.id}
                                        className={`flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all duration-200 ${checked ? 'border-primary-brand bg-primary-brand/5 shadow-md shadow-primary-brand/5' : 'border-transparent hover:bg-slate-100 dark:hover:bg-slate-700/50'}`}
                                    >
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${checked ? 'bg-primary-brand border-primary-brand' : 'border-slate-300 dark:border-slate-600'}`}>
                                            {checked && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                                        </div>
                                        <input
                                            type="radio"
                                            name="alumno-seleccion"
                                            className="hidden"
                                            checked={checked}
                                            onChange={() => handleAlumnoToggle(alumno.id)}
                                        />
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{alumno.alumno}</span>
                                            <span className="text-xs font-medium text-slate-500">{alumno.unidad}</span>
                                        </div>
                                    </label>
                                )
                            })
                        )}
                    </div>
                </div>

                <div className="pt-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <p className="text-sm text-slate-500">
                        {selectedAlumnos.length > 0 ? (
                            <span className="font-medium text-primary-brand">
                                Alumno seleccionado
                            </span>
                        ) : (
                            'Busca y selecciona tu nombre de la lista'
                        )}
                    </p>
                    <div className="flex gap-4 w-full sm:w-auto">
                        <button
                            type="button"
                            onClick={() => setStep(1)}
                            className="flex-1 sm:flex-none px-8 py-4 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white font-semibold transition-colors bg-slate-100 dark:bg-slate-800"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={loading || selectedAlumnos.length === 0}
                            className="flex-1 sm:flex-none bg-primary-brand hover:bg-primary-light text-white px-10 py-4 rounded-xl font-bold shadow-xl shadow-primary-brand/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale disabled:pointer-events-none"
                        >
                            {loading ? 'Enviando...' : 'Entrar en lista'}
                            {!loading && <CheckCircle className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white dark:bg-slate-900 shadow-2xl rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-800 transition-all duration-300">
            <header className="bg-primary-brand/[0.03] px-8 py-8 border-b border-slate-100 dark:border-slate-800">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                            Solicitud de uso de aseo
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">
                            Solicita acceso a un aseo.
                        </p>
                    </div>
                    <SolicitudHeaderBadge />
                </div>
            </header>

            <div className="p-8 md:p-12">
                {renderContent()}
            </div>
        </div>
    )
}
