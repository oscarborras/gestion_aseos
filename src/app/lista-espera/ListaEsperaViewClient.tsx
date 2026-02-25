'use client'

import { Clock, Users } from 'lucide-react'

interface WaitingItem {
    id: number
    alumno_id: string
    nombre: string
    unidad: string
    sexo: string
    fecha: string
}

export default function ListaEsperaViewClient({
    waitingList
}: {
    waitingList: WaitingItem[]
}) {
    // Listado separado por sexos
    const chicasWaiting = waitingList.filter(s => s.sexo?.toUpperCase() === 'M')
    const chicosWaiting = waitingList.filter(s => s.sexo?.toUpperCase() !== 'M')

    return (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
                <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-indigo-500" />
                    <h2 className="font-bold text-slate-800 dark:text-white text-lg">Cola de Espera Actual</h2>
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
                            <p className="p-12 text-center text-sm text-slate-400 italic font-medium">No hay chicas esperando</p>
                        ) : (
                            chicasWaiting.map((item, index) => (
                                <div key={item.id} className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-pink-100 dark:bg-pink-900/20 flex items-center justify-center text-xs font-bold text-pink-600">
                                            {index + 1}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900 dark:text-white">{item.nombre}</p>
                                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">{item.unidad}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 bg-slate-50 dark:bg-slate-800/50 px-2 py-1 rounded-lg">
                                        <Clock className="w-3.5 h-3.5" />
                                        {new Date(item.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                            <p className="p-12 text-center text-sm text-slate-400 italic font-medium">No hay chicos esperando</p>
                        ) : (
                            chicosWaiting.map((item, index) => (
                                <div key={item.id} className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center text-xs font-bold text-blue-600">
                                            {index + 1}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900 dark:text-white">{item.nombre}</p>
                                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">{item.unidad}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 bg-slate-50 dark:bg-slate-800/50 px-2 py-1 rounded-lg">
                                        <Clock className="w-3.5 h-3.5" />
                                        {new Date(item.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
