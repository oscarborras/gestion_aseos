'use client'

import { useState, useEffect, useRef } from 'react'
import { entregarTurno, entregarTurnoGrupo, anularTurno } from '../actions'
import { User, Key, Users, CheckCircle, Clock, X, AlertTriangle, CircleUser, History, ArrowRight } from 'lucide-react'
import { delay, motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

const MIN_WAITING_FOR_GROUP = 3

interface WaitingItem {
    id: number
    alumno_id: string
    nombre: string
    unidad: string
    sexo: string
    fecha: string
}

interface Aseo {
    id: number
    nombre: string
    estado_id: number
}

export default function EntregarClient({
    waitingList,
    aseos
}: {
    waitingList: WaitingItem[],
    aseos: Aseo[]
}) {
    const router = useRouter()
    const [assignedWaitIds, setAssignedWaitIds] = useState<number[]>([])
    const [loading, setLoading] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const [deliveredIds, setDeliveredIds] = useState<number[]>([])
    const [cancelingId, setCancelingId] = useState<number | null>(null)
    const [pendingCancel, setPendingCancel] = useState<WaitingItem | null>(null)
    const [lastTakers, setLastTakers] = useState<Record<number, string[]>>({})

    // Estados para "congelar" la vista durante la transición
    const [frozenStudents, setFrozenStudents] = useState<WaitingItem[]>([])
    const [frozenNext, setFrozenNext] = useState<WaitingItem | undefined>(undefined)

    // Refs para evitar problemas de clausura en Realtime sin re-subscribirse
    const loadingRef = useRef(loading)
    const isSuccessRef = useRef(isSuccess)

    useEffect(() => {
        loadingRef.current = loading
        isSuccessRef.current = isSuccess
    }, [loading, isSuccess])

    const availableAseos = aseos.filter(a => a.estado_id === 1)

    // Función para obtener los últimos repartos para cada aseo
    const fetchLastTakers = async () => {
        const supabase = createClient()
        // Obtenemos los últimos 40 registros para cubrir posibles grupos y todos los aseos
        const { data } = await supabase
            .from('registros')
            .select('aseo_id, fecha_entrada, alumnos (alumno)')
            .order('fecha_entrada', { ascending: false })
            .limit(40)

        if (!data) return

        const newestByAseo: Record<number, { time: string, names: string[] }> = {}

        data.forEach((reg: any) => {
            const time = reg.fecha_entrada
            const name = reg.alumnos?.alumno
            if (!name) return

            if (!newestByAseo[reg.aseo_id]) {
                newestByAseo[reg.aseo_id] = { time, names: [name] }
            } else {
                // Si el registro está en la misma entrega (ventana de 3 segundos), lo añadimos al grupo
                const newestTime = new Date(newestByAseo[reg.aseo_id].time).getTime()
                const currentTime = new Date(time).getTime()
                if (Math.abs(newestTime - currentTime) < 3000) {
                    // Evitar duplicados por si acaso si es el mismo alumno 
                    // (aunque el esquema permite el mismo alumno en distintos registros)
                    if (!newestByAseo[reg.aseo_id].names.includes(name)) {
                        newestByAseo[reg.aseo_id].names.push(name)
                    }
                }
            }
        })

        const resultMap: Record<number, string[]> = {}
        Object.entries(newestByAseo).forEach(([id, payload]) => {
            resultMap[Number(id)] = payload.names
        })
        setLastTakers(resultMap)
    }

    // Configurar Supabase Realtime para actualizar la lista de entrega de forma reactiva
    useEffect(() => {
        const supabase = createClient()

        fetchLastTakers()

        // Canal para lista de espera
        const waitingChannel = supabase
            .channel('db-waiting-changes')
            .on(
                'postgres_changes',
                {
                    event: '*', // INSERT, UPDATE, DELETE
                    schema: 'public',
                    table: 'lista_espera'
                },
                () => {
                    // Usar refs para obtener el valor más reciente sin re-subscribirse
                    if (!loadingRef.current && !isSuccessRef.current) {
                        router.refresh()
                    }
                }
            )
            .subscribe()

        // Canal para cambios en aseos (disponibilidad)
        const aseosChannel = supabase
            .channel('db-aseos-availability')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'aseos'
                },
                () => {
                    if (!loadingRef.current && !isSuccessRef.current) {
                        router.refresh()
                    }
                }
            )
            .subscribe()

        // Canal para cambios en registros (para los últimos alumnos)
        const registrosChannel = supabase
            .channel('db-registros-changes')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'registros'
                },
                () => {
                    fetchLastTakers()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(waitingChannel)
            supabase.removeChannel(aseosChannel)
            supabase.removeChannel(registrosChannel)
        }
    }, [router]) // Solo depende de router ahora

    const handleCancelTurno = (item: WaitingItem) => {
        // Muestra el modal en lugar del confirm() nativo
        setPendingCancel(item)
    }

    const confirmCancel = async () => {
        if (!pendingCancel) return
        const item = pendingCancel
        setPendingCancel(null)
        setCancelingId(item.id)
        const result = await anularTurno(item.id)
        setCancelingId(null)
        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success(`Turno de ${item.nombre} anulado`)
            router.refresh()
        }
    }

    // Encontrar el primer alumno elegible (punto de partida)
    const initialAssignment = () => {
        for (const student of waitingList) {
            const isChica = student.sexo?.toUpperCase() === 'M'
            // Invertimos la prioridad (ahora preferirá Planta Alta para chicas y Planta Baja para chicos)
            const matchingAseo = [...availableAseos].reverse().find(a =>
                isChica
                    ? a.nombre.toLowerCase().includes('chica')
                    : a.nombre.toLowerCase().includes('chico')
            )
            if (matchingAseo) return { student, aseo: matchingAseo }
        }
        return null
    }

    const firstMatch = initialAssignment()

    // Lista de alumnos actualmente en el "Bloque 1" que aún no han sido marcados como entregados visualmente
    const currentStudents = firstMatch
        ? [firstMatch.student, ...waitingList.filter(s => assignedWaitIds.includes(s.id))]
            .filter(s => !deliveredIds.includes(s.id))
        : []

    // Encontrar al siguiente alumno que NO está en el reparto actual para mostrar como "próximo"
    const nextInQueue = waitingList.find(s =>
        !currentStudents.some(cs => cs.id === s.id) &&
        !deliveredIds.includes(s.id) &&
        (firstMatch ? s.id !== firstMatch.student.id : true)
    )

    const assignedAseo = firstMatch?.aseo

    const handleAddStudent = () => {
        if (!firstMatch) return

        const currentSex = firstMatch.student.sexo?.toUpperCase()
        const alreadyInList = currentStudents.map(s => s.id)

        // Buscar el siguiente del mismo sexo que no esté ya en la lista
        const nextInLine = waitingList.find(s =>
            s.sexo?.toUpperCase() === currentSex &&
            !alreadyInList.includes(s.id)
        )

        if (nextInLine) {
            setAssignedWaitIds(prev => [...prev, nextInLine.id])
        } else {
            toast.error('No hay más alumnos del mismo sexo esperando')
        }
    }

    const handleRemoveStudent = () => {
        if (assignedWaitIds.length > 0) {
            setAssignedWaitIds(prev => prev.slice(0, -1))
        }
    }

    // Listado separado por sexos para el Bloque 2
    const chicasWaiting = waitingList.filter(s => s.sexo?.toUpperCase() === 'M')
    const chicosWaiting = waitingList.filter(s => s.sexo?.toUpperCase() !== 'M')

    // Lógica para auto-asignar pareja si hay mucha gente esperando
    useEffect(() => {
        if (!firstMatch) {
            setAssignedWaitIds([])
            return
        }

        const sex = firstMatch.student.sexo?.toUpperCase()
        const sameSexWaiting = sex === 'M' ? chicasWaiting : chicosWaiting

        // Si hay >= MIN_WAITING_FOR_GROUP del mismo sexo esperando,
        // y todavía no hemos asignado a nadie extra manualmente (o el que hay es el auto-asignado),
        // pre-cargamos al segundo de la lista.
        if (sameSexWaiting.length >= MIN_WAITING_FOR_GROUP && assignedWaitIds.length === 0) {
            const secondInLine = sameSexWaiting.find(s => s.id !== firstMatch.student.id)
            if (secondInLine) {
                setAssignedWaitIds([secondInLine.id])
            }
        }

        // Si el primer match cambia radicalmente (otro alumno o aseo),
        // quizá deberíamos resetear, pero el router.refresh() ya limpia el estado 
        // de la página si se navega. Aquí mejor ser conservadores para no borrar 
        // selecciones manuales del usuario.
    }, [firstMatch?.student.id, chicasWaiting.length, chicosWaiting.length])

    const handleDeliver = async () => {
        if (!assignedAseo || currentStudents.length === 0) return

        // Congelar los alumnos actuales y el siguiente antes de empezar para que no desaparezcan
        setFrozenStudents([...currentStudents])
        setFrozenNext(nextInQueue)
        setLoading(true)

        const studentsToDeliver = [...currentStudents]

        // Procesar todos los alumnos seleccionados en bloque
        const alumnosData = studentsToDeliver.map(s => ({
            waitingId: s.id,
            alumnoId: s.alumno_id
        }))

        const result = await entregarTurnoGrupo(alumnosData, assignedAseo.id)

        if (result.error) {
            setLoading(false)
            toast.error(result.error)
            setFrozenStudents([])
            setFrozenNext(undefined)
        } else {
            // Iniciar animación de salida
            setIsSuccess(true)
            setDeliveredIds(prev => [...prev, ...studentsToDeliver.map(s => s.id)])

            toast.success(`${studentsToDeliver.length > 1 ? 'Llaves entregadas' : 'Llave entregada'} con éxito`)

            // Esperar 2 segundos para que la información del siguiente alumno sea plenamente legible
            setTimeout(() => {
                setDeliveredIds([])
                setAssignedWaitIds([])
                setIsSuccess(false)
                setLoading(false)
                setFrozenStudents([])
                setFrozenNext(undefined)
                router.refresh()
            }, 2000)
        }
    }

    const getAbbreviatedName = (name: string) => {
        return name
            .replace("Planta Alta", "P.Alta")
            .replace("Planta Baja", "P.Baja");
    }

    return (
        <>
            {/* Fila superior: Estado de los aseos en tiempo real */}
            <div className="mb-8 grid grid-cols-2 md:grid-cols-4 gap-3">
                {aseos.map(aseo => {
                    const abbreviated = getAbbreviatedName(aseo.nombre);
                    const isChica = aseo.nombre.toLowerCase().includes('chica');
                    const nameColorClass = isChica
                        ? "text-pink-600 dark:text-pink-400"
                        : "text-blue-600 dark:text-blue-400";

                    const isLibre = aseo.estado_id === 1;
                    const isOcupado = aseo.estado_id === 2;
                    const isMantenimiento = aseo.estado_id === 3;

                    return (
                        <div
                            key={`status-${aseo.id}`}
                            className={`p-3 rounded-2xl border transition-all duration-300 flex flex-col items-center justify-center gap-1 shadow-sm
                                ${isLibre
                                    ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/30'
                                    : isOcupado
                                        ? 'bg-amber-50/50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/30'
                                        : 'bg-red-50/50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30'
                                }`}
                        >
                            <span className={`text-[12px] font-black uppercase tracking-widest ${nameColorClass}`}>
                                {abbreviated}
                            </span>
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full animate-pulse ${isLibre ? 'bg-emerald-500' : isOcupado ? 'bg-amber-500' : 'bg-red-500'}`} />
                                <span className={`text-xs font-bold ${isLibre ? 'text-emerald-600' : isOcupado ? 'text-amber-600' : 'text-red-600'}`}>
                                    {isLibre ? 'LIBRE' : isOcupado ? 'OCUPADO' : 'FUERA DE SERVICIO'}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Modal de confirmación de anulación */}
            {pendingCancel && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Overlay */}
                    <div
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        onClick={() => setPendingCancel(null)}
                    />
                    {/* Contenido del modal */}
                    <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 p-8 w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
                        {/* Icono de advertencia */}
                        <div className="flex justify-center mb-6">
                            <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                                <AlertTriangle className="w-8 h-8 text-red-500" />
                            </div>
                        </div>
                        {/* Texto */}
                        <div className="text-center mb-8 space-y-2">
                            <h2 className="text-xl font-black text-slate-900 dark:text-white">Anular turno</h2>
                            <p className="text-slate-500 dark:text-slate-400">
                                ¿Estás seguro de que quieres anular el turno de{' '}
                                <span className="font-bold text-slate-900 dark:text-white">{pendingCancel.nombre}</span>?
                            </p>
                            <p className="text-xs text-slate-400 dark:text-slate-500 pt-1">
                                Esta acción quedará registrada en el historial de anulaciones.
                            </p>
                        </div>
                        {/* Botones */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => setPendingCancel(null)}
                                className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmCancel}
                                className="flex-1 px-4 py-3 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-semibold shadow-lg shadow-red-500/20 transition-colors flex items-center justify-center gap-2"
                            >
                                <X className="w-4 h-4" />
                                Sí, anular turno
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Bloque 1: Siguiente entrega (Ocupa 1/3 en desktop) */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 shadow-xl relative overflow-hidden h-full flex flex-col">
                        <div className="absolute top-0 right-0 p-4">
                            <div className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                                Siguiente Turno
                            </div>
                        </div>

                        <div className="space-y-6 mt-4 flex-grow flex flex-col">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center text-emerald-600">
                                    <Key className="w-7 h-7" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Reparto de llaves</h2>
                                    <p className="text-sm text-slate-500">Asignación automática</p>
                                </div>
                            </div>

                            {firstMatch && assignedAseo ? (
                                <div className="space-y-6 flex-grow flex flex-col">
                                    <div className="rounded-2xl border-2 border-amber-100 dark:border-amber-900/30 overflow-hidden shadow-lg shadow-amber-500/10">
                                        {/* Sección Aseo Destino - AHORA MÁS DESTACADA */}
                                        <div className="p-6 bg-amber-50 dark:bg-amber-900/40 border-b-2 border-amber-100 dark:border-amber-900/30 relative">
                                            <div className="absolute top-4 right-4">
                                                <div className="animate-pulse w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.8)]" />
                                            </div>
                                            <div className="flex items-start gap-4">
                                                <div className="w-12 h-10 bg-white dark:bg-slate-800 rounded-md flex items-center justify-center shadow-md shrink-0 transform rotate-1 border-2 border-amber-500">
                                                    <span className="text-[16px] font-black text-amber-600 dark:text-amber-500 leading-none tracking-tighter">WC</span>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-[0.2em]">Aseo Asignado</p>
                                                    <p className="font-extrabold text-slate-900 dark:text-white text-1xl leading-none tracking-tight">{assignedAseo.nombre}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Sección Alumnos */}
                                        <div className="p-6 bg-white dark:bg-slate-900/40 space-y-4">
                                            <div className="flex items-center justify-between">
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Alumnos/as</p>
                                                <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                                                    {currentStudents.length} {currentStudents.length === 1 ? 'persona' : 'personas'}
                                                </span>
                                            </div>
                                            <div className="space-y-4">
                                                <AnimatePresence mode="popLayout">
                                                    {(isSuccess || loading ? frozenStudents : currentStudents).map((s) => (
                                                        <motion.div
                                                            key={s.id}
                                                            layout
                                                            initial={{ opacity: 0, x: -20 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            exit={{ opacity: 0, x: 20, filter: 'blur(8px)' }}
                                                            transition={{ duration: 0.3 }}
                                                            className="flex items-center gap-4 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                                                        >
                                                            <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center border border-slate-200 dark:border-slate-700 shrink-0">
                                                                <User className="w-5 h-5 text-slate-400" />
                                                            </div>
                                                            <div className="flex-grow">
                                                                <p className="font-bold text-slate-900 dark:text-white text-base leading-tight">{s.nombre}</p>
                                                                <p className="text-xs text-slate-500 font-bold">{s.unidad}</p>
                                                            </div>
                                                            {isSuccess && (
                                                                <motion.div
                                                                    initial={{ scale: 0 }}
                                                                    animate={{ scale: 1 }}
                                                                    className="text-emerald-500"
                                                                >
                                                                    <CheckCircle className="w-5 h-5" />
                                                                </motion.div>
                                                            )}
                                                        </motion.div>
                                                    ))}
                                                </AnimatePresence>

                                                {/* Información temporal sobre el siguiente alumno */}
                                                <AnimatePresence>
                                                    {(isSuccess || loading) && (frozenNext || nextInQueue) && (
                                                        <motion.div
                                                            initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                                            animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                                                            exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                                            className="p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl flex items-center justify-between overflow-hidden"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/40 rounded-full flex items-center justify-center">
                                                                    <ArrowRight className="w-4 h-4 text-indigo-600" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Siguiente en espera</p>
                                                                    <p className="text-sm font-bold text-slate-700 dark:text-indigo-200">{(frozenNext || nextInQueue)?.nombre}</p>
                                                                </div>
                                                            </div>
                                                            <div className="text-[10px] bg-indigo-200/50 dark:bg-indigo-800/50 px-2 py-1 rounded-md font-bold text-indigo-700 dark:text-indigo-300">
                                                                {(frozenNext || nextInQueue)?.unidad}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3 pt-4 mt-auto">
                                        <div className="flex flex-col gap-2">
                                            <button
                                                onClick={handleAddStudent}
                                                className="w-full bg-white dark:bg-slate-800 hover:bg-slate-50 border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold py-3 rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2 text-sm"
                                            >
                                                <Users className="w-4 h-4" />
                                                Añadir otro alumno/a
                                            </button>

                                            {assignedWaitIds.length > 0 && (
                                                <button
                                                    onClick={handleRemoveStudent}
                                                    className="w-full bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 text-slate-500 dark:text-slate-400 font-bold py-3 rounded-2xl border-2 border-transparent transition-all active:scale-95 flex items-center justify-center gap-2 text-sm"
                                                >
                                                    <User className="w-4 h-4" />
                                                    Quitar un alumno/a
                                                </button>
                                            )}
                                        </div>

                                        <button
                                            onClick={handleDeliver}
                                            disabled={loading}
                                            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-5 rounded-2xl shadow-lg shadow-emerald-500/30 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 text-lg"
                                        >
                                            {loading ? (
                                                'Procesando...'
                                            ) : (
                                                <>
                                                    <Key className="w-6 h-6" />
                                                    Entregar llave
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-12 px-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
                                    <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                    <p className="text-slate-500 font-medium">No hay alumnos esperando o no hay aseos libres para sus sexos.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Bloque 2: Lista completa de espera (Ocupa 2/3 en desktop) */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-full">
                        <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
                            <div className="flex items-center gap-2">
                                <Users className="w-5 h-5 text-indigo-500" />
                                <h2 className="font-bold text-slate-800 dark:text-white">Lista de Espera Actual</h2>
                            </div>
                            <span className="text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-500 px-3 py-1 rounded-full">
                                {waitingList.length} Personas
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-800 last:border-b-0">
                            {/* Columna Chicas */}
                            <div className="flex flex-col h-full min-h-[400px]">
                                <div className="p-4 bg-pink-500/5 border-b border-slate-50 dark:border-slate-800">
                                    <h3 className="text-sm font-black text-pink-600 dark:text-pink-400 uppercase tracking-widest flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-pink-500" />
                                        Chicas ({chicasWaiting.length})
                                    </h3>
                                </div>
                                <div className="p-2 space-y-1 overflow-y-auto">
                                    {chicasWaiting.length === 0 ? (
                                        <p className="p-8 text-center text-sm text-slate-400 italic">No hay chicas esperando</p>
                                    ) : (
                                        chicasWaiting.map((item, index) => (
                                            <div key={item.id} className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-pink-100 dark:bg-pink-900/20 flex items-center justify-center text-xs font-bold text-pink-600">
                                                        {index + 1}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-900 dark:text-white">{item.nombre}</p>
                                                        <p className="text-[10px] font-medium text-slate-400">{item.unidad}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                                                        <Clock className="w-3 h-3" />
                                                        {new Date(item.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                    <button
                                                        onClick={() => handleCancelTurno(item)}
                                                        disabled={cancelingId === item.id}
                                                        title="Anular turno"
                                                        className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 text-red-500 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/60 flex items-center justify-center disabled:opacity-50"
                                                    >
                                                        {cancelingId === item.id
                                                            ? <span className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                                                            : <X className="w-3 h-3" />}
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Columna Chicos */}
                            <div className="flex flex-col h-full min-h-[400px]">
                                <div className="p-4 bg-blue-500/5 border-b border-slate-50 dark:border-slate-800">
                                    <h3 className="text-sm font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                                        Chicos ({chicosWaiting.length})
                                    </h3>
                                </div>
                                <div className="p-2 space-y-1 overflow-y-auto">
                                    {chicosWaiting.length === 0 ? (
                                        <p className="p-8 text-center text-sm text-slate-400 italic">No hay chicos esperando</p>
                                    ) : (
                                        chicosWaiting.map((item, index) => (
                                            <div key={item.id} className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center text-xs font-bold text-blue-600">
                                                        {index + 1}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-900 dark:text-white">{item.nombre}</p>
                                                        <p className="text-[10px] font-medium text-slate-400">{item.unidad}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                                                        <Clock className="w-3 h-3" />
                                                        {new Date(item.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                    <button
                                                        onClick={() => handleCancelTurno(item)}
                                                        disabled={cancelingId === item.id}
                                                        title="Anular turno"
                                                        className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 text-red-500 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/60 flex items-center justify-center disabled:opacity-50"
                                                    >
                                                        {cancelingId === item.id
                                                            ? <span className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                                                            : <X className="w-3 h-3" />}
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Nueva sección: Últimas personas por aseo */}
            <div className="mt-8 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-2 mb-6 text-slate-400">
                    <History className="w-5 h-5" />
                    <h2 className="text-sm font-black uppercase tracking-[0.2em]">Registro Última Entrega</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {aseos.map(aseo => {
                        // Abreviar nombre: Planta Alta Chicos -> PA Chicos
                        const abbreviated = getAbbreviatedName(aseo.nombre);
                        const isChica = aseo.nombre.toLowerCase().includes('chica');
                        const nameColorClass = isChica
                            ? "text-pink-600 dark:text-pink-400"
                            : "text-blue-600 dark:text-blue-400";

                        return (
                            <div
                                key={aseo.id}
                                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-700/50 flex flex-col gap-1 group hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-colors"
                            >
                                <div className="flex items-center justify-between">
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${nameColorClass}`}>
                                        {abbreviated}
                                    </span>
                                    <div className={`w-2 h-2 rounded-full ${aseo.estado_id === 1 ? 'bg-emerald-500' : aseo.estado_id === 2 ? 'bg-amber-500' : 'bg-red-500'}`} />
                                </div>
                                <div className="min-h-[1.5rem] flex flex-col justify-center">
                                    {lastTakers[aseo.id] && lastTakers[aseo.id].length > 0 ? (
                                        lastTakers[aseo.id].map((name, i) => (
                                            <p key={i} className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-tight">
                                                {i + 1}. {name}
                                            </p>
                                        ))
                                    ) : (
                                        <p className="text-xs text-slate-400 italic">Sin registros recientes</p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </>
    )
}
