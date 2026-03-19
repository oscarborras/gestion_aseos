'use client'

import { useMemo, useState, useTransition } from 'react'
import { Search, X, User, Trash2, Calendar, GraduationCap, AlertCircle, Loader2, TriangleAlert } from 'lucide-react'
import { addAlumnoSeguimiento, removeAlumnoSeguimiento } from '../actions'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface Alumno {
    id: string
    name: string
    unidad: string
}

interface AlumnoSeguimiento extends Alumno {
    created_at: string
}

interface SeguimientoClientProps {
    allAlumnos: Alumno[]
    initialSeguimiento: any[]
}

export default function SeguimientoClient({ allAlumnos, initialSeguimiento }: SeguimientoClientProps) {
    const [searchQuery, setSearchQuery] = useState('')
    const [isPending, startTransition] = useTransition()
    const [seguimiento, setSeguimiento] = useState(initialSeguimiento)
    
    // Estado para el modal de eliminación
    const [deleteModalOpen, setDeleteModalOpen] = useState(false)
    const [alumnoToDelete, setAlumnoToDelete] = useState<AlumnoSeguimiento | null>(null)

    const filteredAlumnos = useMemo(() => {
        if (!searchQuery.trim() || searchQuery.length < 2) return []
        const words = searchQuery.toLowerCase().split(' ').filter(word => word.length > 0)
        
        return allAlumnos.filter(a => {
            const studentText = `${a.name} ${a.unidad}`.toLowerCase()
            return words.every(word => studentText.includes(word))
        }).slice(0, 5)
    }, [allAlumnos, searchQuery])

    const handleAdd = async (alumno: Alumno) => {
        setSearchQuery('')
        startTransition(async () => {
            const result = await addAlumnoSeguimiento(alumno.id)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success(`Alumno ${alumno.name} añadido correctamente`)
                setSeguimiento(prev => [{ ...alumno, created_at: new Date().toISOString() }, ...prev])
            }
        })
    }

    const openDeleteModal = (alumno: AlumnoSeguimiento) => {
        setAlumnoToDelete(alumno)
        setDeleteModalOpen(true)
    }

    const confirmDelete = async () => {
        if (!alumnoToDelete) return

        const id = alumnoToDelete.id
        const name = alumnoToDelete.name
        
        setDeleteModalOpen(false)
        
        startTransition(async () => {
            const result = await removeAlumnoSeguimiento(id)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success(`Alumno ${name} eliminado del seguimiento`)
                setSeguimiento(prev => prev.filter(a => a.id !== id))
            }
            setAlumnoToDelete(null)
        })
    }

    return (
        <div className="space-y-8">
            {/* Buscador de Alumnos - Versión Compacta */}
            <section className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative z-50">
                <div className="flex flex-col lg:flex-row items-center gap-6">
                    <div className="flex-shrink-0 flex items-center gap-4">
                        <div className="h-12 w-12 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center text-amber-600">
                            <Search className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-base font-black text-slate-900 dark:text-white leading-tight">Añadir al Seguimiento</h2>
                            <p className="text-xs text-slate-500 font-medium">Busca por nombre o curso para añadir</p>
                        </div>
                    </div>

                    <div className="relative flex-1 w-full">
                        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-primary-brand/20 transition-all">
                            <Search className="w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Escribe el nombre o curso del alumno..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-transparent border-none outline-none flex-1 text-slate-900 dark:text-white placeholder:text-slate-500 font-medium text-sm"
                            />
                            {isPending && <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />}
                            {searchQuery && !isPending && (
                                <button onClick={() => setSearchQuery('')} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">
                                    <X className="w-5 h-5 text-slate-400" />
                                </button>
                            )}
                        </div>

                        {/* Resultados de búsqueda */}
                        {searchQuery.length >= 2 && (
                            <div className="absolute top-full left-0 right-0 mt-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                {filteredAlumnos.length > 0 ? (
                                    filteredAlumnos.map((a) => {
                                        const isAlreadyIn = (seguimiento as any[]).some(s => s.id === a.id);
                                        return (
                                            <button
                                                key={a.id}
                                                onClick={() => !isAlreadyIn && handleAdd(a)}
                                                disabled={isAlreadyIn}
                                                className={`w-full flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-b border-slate-100 dark:border-slate-800 last:border-0 ${isAlreadyIn ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            >
                                                <div className="h-10 w-10 bg-primary-brand/10 text-primary-brand rounded-xl flex items-center justify-center flex-shrink-0">
                                                    <User className="w-5 h-5" />
                                                </div>
                                                <div className="text-left flex-1">
                                                    <p className="font-bold text-slate-900 dark:text-white">{a.name}</p>
                                                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest flex items-center gap-1.5">
                                                        <GraduationCap className="w-3 h-3" />
                                                        {a.unidad}
                                                    </p>
                                                </div>
                                                <div className={`font-bold text-[10px] uppercase px-3 py-1.5 rounded-lg transition-colors ${
                                                    isAlreadyIn 
                                                    ? 'bg-slate-100 text-slate-400' 
                                                    : 'bg-primary-brand/10 text-primary-brand hover:bg-primary-brand hover:text-white'
                                                }`}>
                                                    {isAlreadyIn ? 'Ya en lista' : 'Seleccionar'}
                                                </div>
                                            </button>
                                        );
                                    })
                                ) : (
                                    <div className="p-8 text-center text-slate-500">
                                        <AlertCircle className="w-8 h-8 mx-auto mb-3 opacity-20" />
                                        No se han encontrado alumnos con ese nombre.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Listado de Alumnos en Seguimiento */}
            <section className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Alumnos en Seguimiento</h2>
                        <p className="text-slate-500 text-sm font-medium mt-1">Nombre, apellidos y curso de los alumnos supervisados.</p>
                    </div>
                    <div className="bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 px-4 py-2 rounded-2xl text-sm font-black border border-indigo-100 dark:border-indigo-900/30">
                        {seguimiento.length} ALUMNOS
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800/50">
                                    <th className="px-8 py-5 text-left text-xs font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 dark:border-slate-800">Nombre y Apellidos</th>
                                    <th className="px-8 py-5 text-left text-xs font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 dark:border-slate-800">Curso</th>
                                    <th className="px-8 py-5 text-center text-xs font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 dark:border-slate-800">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {seguimiento.length > 0 ? (
                                    seguimiento.map((a) => (
                                        <tr key={a.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center font-bold text-sm">
                                                        {a.name.substring(0, 1)}
                                                    </div>
                                                    <p className="font-bold text-slate-900 dark:text-white">{a.name}</p>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className="inline-flex px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-black tracking-widest uppercase">
                                                    {a.unidad}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-center">
                                                <button
                                                    onClick={() => openDeleteModal(a)}
                                                    disabled={isPending}
                                                    className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all disabled:opacity-50 text-xs font-bold gap-2"
                                                    title="Eliminar del seguimiento"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                    <span>ELIMINAR</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={3} className="px-8 py-16 text-center text-slate-400">
                                            <div className="max-w-xs mx-auto space-y-3">
                                                <div className="h-16 w-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <User className="w-8 h-8 opacity-20" />
                                                </div>
                                                <p className="font-bold text-slate-500">No hay alumnos en seguimiento</p>
                                                <p className="text-xs">Utiliza el buscador de arriba para añadir alumnos a esta lista de vigilancia.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* Modal de Confirmación de Eliminación */}
            <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
                <DialogContent className="sm:max-w-[425px] rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
                    <DialogHeader className="p-8 pt-10 pb-6 text-center">
                        <div className="mx-auto h-20 w-20 bg-rose-50 dark:bg-rose-900/20 rounded-3xl flex items-center justify-center text-rose-500 mb-6 animate-in zoom-in-50 duration-300">
                            <TriangleAlert className="h-10 w-10" />
                        </div>
                        <DialogTitle className="text-2xl font-black text-slate-900 dark:text-white mb-2">
                            Confirmar eliminación
                        </DialogTitle>
                        <DialogDescription className="text-slate-500 text-base">
                            ¿Estás seguro de que deseas eliminar a <span className="font-bold text-slate-900 dark:text-white underline decoration-rose-500/30 underline-offset-4">{alumnoToDelete?.name}</span> de la lista de seguimiento?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex-row gap-3 p-8 bg-slate-50 dark:bg-slate-800/50">
                        <Button 
                            variant="outline" 
                            onClick={() => setDeleteModalOpen(false)}
                            className="flex-1 rounded-2xl h-12 font-bold text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800"
                        >
                            Cancelar
                        </Button>
                        <Button 
                            variant="destructive" 
                            onClick={confirmDelete}
                            className="flex-1 rounded-2xl h-12 font-bold bg-rose-500 hover:bg-rose-600 shadow-lg shadow-rose-500/20 text-white"
                        >
                            Sí, eliminar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
