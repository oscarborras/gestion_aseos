'use client'

import { useState } from 'react'
import { UploadCloud, CheckCircle, Save, Table, Info, AlertOctagon } from 'lucide-react'
import { toast } from 'sonner'
import { insertAlumnos } from '../../actions'

type ParsedRow = {
    alumno: string;
    unidad: string;
    sexo: string;
    valido: boolean;
    error?: string;
}

export default function ImportClient({ initialCount, lastUpdate }: { initialCount: number; lastUpdate: string | null }) {
    const [file, setFile] = useState<File | null>(null)
    const [rows, setRows] = useState<ParsedRow[]>([])
    const [loading, setLoading] = useState(false)

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const uploadedFile = e.target.files?.[0]
        if (!uploadedFile) return

        setFile(uploadedFile)

        const reader = new FileReader()
        reader.onload = (event) => {
            const text = event.target?.result as string
            // Procesamiento CSV Básico
            const lines = text.split('\n').filter(line => line.trim() !== '')

            const parsedRows: ParsedRow[] = []

            let startIdx = 0
            // Detectar cabecera (alumno, unidad)
            if (lines[0].toLowerCase().includes('alumno') && lines[0].toLowerCase().includes('unidad')) {
                startIdx = 1
            }

            for (let i = startIdx; i < lines.length; i++) {
                const line = lines[i].trim()
                if (!line) continue

                // Lógica para manejar: "Dato 1";"Dato 2" o Dato 1;Dato 2
                // Primero dividimos por el separador ;
                const rawParts = line.split(';')

                // Limpiamos las comillas envolventes de cada parte
                const parts = rawParts.map(p => p.trim().replace(/^"|"$/g, ''))

                if (parts.length >= 3) {
                    const alumno = parts[0]
                    const unidad = parts[1]
                    const sexo = parts[2]

                    parsedRows.push({
                        alumno,
                        unidad,
                        sexo,
                        valido: !!(alumno && unidad && sexo)
                    })
                } else {
                    parsedRows.push({
                        alumno: 'Error',
                        unidad: '-',
                        sexo: '-',
                        valido: false,
                        error: 'Formato inválido (se esperaba ; con 3 columnas)'
                    })
                }
            }

            setRows(parsedRows)
        }
        reader.readAsText(uploadedFile)
    }

    const handleImport = async () => {
        const validRows = rows.filter(r => r.valido)
        if (validRows.length === 0) {
            toast.error('No hay registros válidos para importar.')
            return
        }

        setLoading(true)

        // Preparar el payload enviando solo datos válidos
        const payload = validRows.map(r => ({
            nombreCompleto: r.alumno,
            nombreCurso: r.unidad,
            sexo: r.sexo
        }))

        const result = await insertAlumnos(payload)

        setLoading(false)

        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success(`${result.count} alumnos importados correctamente.`)
            setRows([])
            setFile(null)
        }
    }

    return (
        <div className="space-y-8">
            {/* Upload Zone */}
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-8">
                <div className="max-w-3xl mx-auto">
                    <div className="mb-6 p-4 rounded-lg bg-primary-brand/5 border border-primary-brand/20 flex gap-4 items-start">
                        <Info className="w-5 h-5 text-primary-brand shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-primary-brand">Formato de archivo requerido</p>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                Sube un archivo <strong className="font-semibold">CSV</strong> con las columnas separadas por <strong className="font-semibold">punto y coma (;)</strong> y con los textos delimitados por <strong className="font-semibold">comillas (")</strong>. Ejemplo: <code className="bg-primary-brand/10 px-1 rounded dark:text-primary-brand">"Nombre del Alumno";"Curso";"Sexo"</code>.
                                <br /><br />
                                <strong className="font-semibold">Se añadirán los alumnos nuevos sin borrar los existentes. El sistema evitará duplicar alumnos que ya estén registrados.</strong>
                            </p>
                        </div>
                    </div>

                    {/* Stats Card */}
                    <div className="mb-8 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                                <Table className="w-6 h-6 text-primary-brand" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Estado actual</p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">{initialCount}</p>
                            </div>
                        </div>
                        <div className="text-right flex flex-col items-end gap-1">
                            <span className="text-xs font-bold text-primary-brand uppercase tracking-widest bg-primary-brand/10 px-3 py-1 rounded-full">
                                Alumnos registrados
                            </span>
                            {lastUpdate && (
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1">
                                    Última actualización: <span className="text-slate-700 dark:text-slate-200">{new Date(lastUpdate).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-12 text-center hover:border-primary-brand dark:hover:border-primary-brand transition-colors group cursor-pointer">
                        <input
                            type="file"
                            accept=".csv"
                            onChange={handleFileUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className="flex flex-col items-center pointer-events-none">
                            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-primary-brand/10 group-hover:text-primary-brand transition-all mb-4">
                                <UploadCloud className="w-8 h-8" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                                {file ? file.name : 'Arrastra tu archivo aquí'}
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-6">
                                {file ? `${(file.size / 1024).toFixed(2)} KB` : 'o haz click para buscar en tu equipo'}
                            </p>

                            {!file && (
                                <button type="button" className="bg-primary-brand hover:bg-primary-light text-white px-6 py-2.5 rounded-lg font-medium shadow-lg shadow-primary-brand/20 transition-all flex items-center gap-2 mx-auto">
                                    Seleccionar Archivo
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Preview Table Section */}
            {rows.length > 0 && (
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
                    <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                        <h2 className="text-lg font-semibold flex items-center gap-2 text-slate-900 dark:text-white">
                            <Table className="w-5 h-5 text-primary-brand" />
                            Vista previa de importación
                        </h2>
                        <span className="text-xs font-bold text-green-600 bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded-full border border-green-100 dark:border-green-800">
                            {rows.filter(r => r.valido).length} válidos detectados
                        </span>
                    </div>

                    <div className="overflow-x-auto max-h-[400px]">
                        <table className="w-full text-left relative">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800/90 backdrop-blur text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                                    <th className="px-6 py-4 font-semibold text-left">Alumno</th>
                                    <th className="px-6 py-4 font-semibold text-left">Unidad</th>
                                    <th className="px-6 py-4 font-semibold text-left">Sexo</th>
                                    <th className="px-6 py-4 font-semibold text-right">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                                {rows.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{row.alumno}</td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium">
                                                {row.unidad}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded font-medium ${row.sexo.toLowerCase().startsWith('h') ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' :
                                                    row.sexo.toLowerCase().startsWith('m') || row.sexo.toLowerCase().startsWith('f') ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-600' :
                                                        'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                                }`}>
                                                {row.sexo}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {row.valido ? (
                                                <span className="flex items-center justify-end gap-1 text-green-600 dark:text-green-500 font-medium whitespace-nowrap">
                                                    <CheckCircle className="w-4 h-4" /> Válido
                                                </span>
                                            ) : (
                                                <span className="flex items-center justify-end gap-1 text-red-600 dark:text-red-500 font-medium whitespace-nowrap">
                                                    <AlertOctagon className="w-4 h-4" /> {row.error}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer Actions */}
                    <div className="px-6 py-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex justify-end items-center gap-4">
                        <button
                            onClick={() => { setRows([]); setFile(null) }}
                            disabled={loading}
                            className="px-6 py-2.5 text-slate-600 dark:text-slate-400 font-medium hover:text-slate-900 dark:hover:text-slate-100 transition-colors disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleImport}
                            disabled={loading || rows.filter(r => r.valido).length === 0}
                            className="bg-primary-brand hover:bg-primary-light text-white px-8 py-2.5 rounded-lg font-semibold shadow-lg shadow-primary-brand/25 transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            <Save className="w-5 h-5" />
                            {loading ? 'Importando...' : 'Confirmar Importación'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
