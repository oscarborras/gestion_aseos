'use client'

import { useMemo, useState } from 'react'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, LineChart, Line, LabelList
} from 'recharts'
import { subDays, isAfter, parseISO, startOfDay, startOfWeek, startOfMonth, addDays } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'
import Link from 'next/link'
import { Users, Clock, Calendar, BarChart3, TrendingUp, User, Search, X, ChevronRight, Award, ExternalLink, CalendarDays } from 'lucide-react'

const MADRID_TZ = 'Europe/Madrid';

const COLORS = [
    'var(--chart-1)',
    'var(--chart-2)',
    'var(--chart-3)',
    'var(--chart-4)',
    'var(--chart-5)',
    'var(--color-primary-brand)',
    'var(--color-primary-light)'
];

export default function StatsClient({ registros }: { registros: any[] }) {
    const [selectedAlumnoId, setSelectedAlumnoId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [timeRange, setTimeRange] = useState<'week' | 'month' | 'total'>('total');
    const [globalTimeRange, setGlobalTimeRange] = useState<'today' | 'yesterday' | 'week' | 'month' | 'total' | 'custom'>('today');
    const [customDate, setCustomDate] = useState<string>('');
    const [franjaGenderFilter, setFranjaGenderFilter] = useState<'total' | 'M' | 'F'>('total');

    const filteredRegistrosGlobal = useMemo(() => {
        if (globalTimeRange === 'total') return registros;

        const now = new Date();
        const zonedNow = toZonedTime(now, MADRID_TZ);
        let startLimit: Date;
        let endLimit: Date | null = null;

        if (globalTimeRange === 'today') {
            startLimit = startOfDay(zonedNow);
        } else if (globalTimeRange === 'yesterday') {
            startLimit = startOfDay(addDays(zonedNow, -1));
            endLimit = startOfDay(zonedNow);
        } else if (globalTimeRange === 'week') {
            startLimit = startOfDay(subDays(zonedNow, 7));
        } else if (globalTimeRange === 'month') {
            startLimit = startOfDay(subDays(zonedNow, 30));
        } else if (globalTimeRange === 'custom' && customDate) {
            const [y, m, d_part] = customDate.split('-').map(Number);
            // Usamos el constructor local para obtener el inicio del día del calendario
            const localDate = new Date(y, m - 1, d_part);
            startLimit = startOfDay(localDate);
            endLimit = addDays(startLimit, 1);
        } else {
            return registros;
        }

        return registros.filter(r => {
            const d = new Date(r.fecha_entrada);
            if (endLimit) {
                return d >= startLimit && d < endLimit;
            }
            return d >= startLimit;
        });
    }, [registros, globalTimeRange, customDate]);

    const uniqueAlumnos = useMemo(() => {
        const alumnosMap: Record<string, { id: string, name: string, unidad: string }> = {};
        registros.forEach(reg => {
            if (reg.alumno_id && !alumnosMap[reg.alumno_id]) {
                alumnosMap[reg.alumno_id] = {
                    id: String(reg.alumno_id),
                    name: reg.alumnos?.alumno || 'Desconocido',
                    unidad: reg.alumnos?.unidad || 'N/A'
                };
            }
        });
        return Object.values(alumnosMap).sort((a, b) => a.name.localeCompare(b.name));
    }, [registros]);

    const filteredAlumnos = useMemo(() => {
        if (!searchQuery.trim()) return [];
        const query = searchQuery.toLowerCase();
        return uniqueAlumnos.filter(a =>
            a.name.toLowerCase().includes(query) ||
            a.unidad.toLowerCase().includes(query)
        ).slice(0, 5);
    }, [uniqueAlumnos, searchQuery]);

    const stats = useMemo(() => {
        if (!filteredRegistrosGlobal.length) return null;

        // 1. Uso por Alumno (Top 10)
        const usagePerAlumno: Record<string, { id: string, name: string, count: number, unidad: string, totalDur: number, validDurCount: number }> = {};
        // 2. Uso por Unidad (Curso)
        const usagePerUnidad: Record<string, number> = {};
        // 3. Uso por Aseo
        const usagePerAseo: Record<string, number> = {};
        // 4. Uso por Género (Sexo)
        const usagePerSexo: Record<string, number> = { 'Chicos': 0, 'Chicas': 0 };
        // 5. Duración media
        let totalDurationMs = 0;
        let validDurationCount = 0;
        // 6. Estado de los Aseos
        const usagePerEstado: Record<string, number> = { 'Bueno': 0, 'Regular': 0, 'Malo': 0 };

        filteredRegistrosGlobal.forEach(reg => {
            // Per Alumno
            const alumnoId = String(reg.alumno_id);
            const alumnoName = reg.alumnos?.alumno || 'Desconocido';
            const unidad = reg.alumnos?.unidad || 'N/A';
            if (!usagePerAlumno[alumnoId]) {
                usagePerAlumno[alumnoId] = { id: alumnoId, name: alumnoName, count: 0, unidad, totalDur: 0, validDurCount: 0 };
            }
            usagePerAlumno[alumnoId].count++;

            // Per Unidad
            usagePerUnidad[unidad] = (usagePerUnidad[unidad] || 0) + 1;

            // Per Aseo
            const aseoName = reg.aseos?.nombre || 'Desconocido';
            usagePerAseo[aseoName] = (usagePerAseo[aseoName] || 0) + 1;

            // Per Sexo
            const sexo = reg.alumnos?.sexo?.toUpperCase();
            if (sexo === 'M') usagePerSexo['Chicas']++;
            else usagePerSexo['Chicos']++;

            // Per Estado
            if (reg.estado_salida && usagePerEstado[reg.estado_salida] !== undefined) {
                usagePerEstado[reg.estado_salida]++;
            }

            // Duration
            if (reg.fecha_salida && reg.fecha_entrada) {
                const duration = new Date(reg.fecha_salida).getTime() - new Date(reg.fecha_entrada).getTime();
                if (duration > 0) {
                    totalDurationMs += duration;
                    validDurationCount++;

                    // Add to individual student
                    usagePerAlumno[alumnoId].totalDur += duration;
                    usagePerAlumno[alumnoId].validDurCount++;
                }
            }
        });

        const topAlumnos = Object.values(usagePerAlumno)
            .map(a => ({
                ...a,
                avgDur: a.validDurCount > 0 ? (a.totalDur / a.validDurCount / 60000) : 0
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        const unidadData = Object.entries(usagePerUnidad)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 18);

        const totalAseosUsos = Object.values(usagePerAseo).reduce((a, b) => a + b, 0);
        const aseoData = Object.entries(usagePerAseo)
            .map(([name, value]) => ({
                name: `${name.replace(/Planta/g, 'P.')} (${totalAseosUsos > 0 ? Math.round((value / totalAseosUsos) * 100) : 0}%)`,
                value
            }));

        const totalSexoUsos = Object.values(usagePerSexo).reduce((a, b) => a + b, 0);
        const sexoData = Object.entries(usagePerSexo)
            .map(([name, value]) => ({
                name: `${name} (${totalSexoUsos > 0 ? Math.round((value / totalSexoUsos) * 100) : 0}%)`,
                value
            }));

        const avgDurationMin = validDurationCount > 0
            ? Math.round(totalDurationMs / validDurationCount / 60000 * 10) / 10
            : 0;

        const statusData = Object.entries(usagePerEstado).map(([name, value]) => ({
            name,
            value,
            percentage: filteredRegistrosGlobal.length > 0 ? Math.round((value / filteredRegistrosGlobal.length) * 100) : 0
        }));

        // 7. Franjas Horarias
        const franjas = [
            { id: '1ª hora', start: { h: 8, m: 15 }, end: { h: 9, m: 14 } },
            { id: '2ª hora', start: { h: 9, m: 15 }, end: { h: 10, m: 14 } },
            { id: '3ª hora', start: { h: 10, m: 15 }, end: { h: 11, m: 14 } },
            { id: '4ª hora', start: { h: 11, m: 45 }, end: { h: 12, m: 44 } },
            { id: '5ª hora', start: { h: 12, m: 45 }, end: { h: 13, m: 44 } },
            { id: '6ª hora', start: { h: 13, m: 45 }, end: { h: 14, m: 45 } },
        ];

        const franjaUsage = {
            total: { '1ª hora': 0, '2ª hora': 0, '3ª hora': 0, '4ª hora': 0, '5ª hora': 0, '6ª hora': 0 },
            M: { '1ª hora': 0, '2ª hora': 0, '3ª hora': 0, '4ª hora': 0, '5ª hora': 0, '6ª hora': 0 },
            F: { '1ª hora': 0, '2ª hora': 0, '3ª hora': 0, '4ª hora': 0, '5ª hora': 0, '6ª hora': 0 }
        };

        filteredRegistrosGlobal.forEach(reg => {
            const date = toZonedTime(new Date(reg.fecha_entrada), MADRID_TZ);
            const h = date.getHours();
            const m = date.getMinutes();
            const timeVal = h * 60 + m;
            const sexo = reg.alumnos?.sexo?.toUpperCase() === 'M' ? 'F' : 'M'; // Corregir mapeo invertido del sistema

            franjas.forEach(f => {
                const startVal = f.start.h * 60 + f.start.m;
                const endVal = f.end.h * 60 + f.end.m;
                if (timeVal >= startVal && timeVal <= endVal) {
                    franjaUsage.total[f.id as keyof typeof franjaUsage.total]++;
                    if (sexo === 'M') franjaUsage.M[f.id as keyof typeof franjaUsage.M]++;
                    if (sexo === 'F') franjaUsage.F[f.id as keyof typeof franjaUsage.F]++;
                }
            });
        });

        // Calculamos promedios globales con base en registros históricos
        const globalFranjaUsage = {
            total: { '1ª hora': 0, '2ª hora': 0, '3ª hora': 0, '4ª hora': 0, '5ª hora': 0, '6ª hora': 0 },
            M: { '1ª hora': 0, '2ª hora': 0, '3ª hora': 0, '4ª hora': 0, '5ª hora': 0, '6ª hora': 0 },
            F: { '1ª hora': 0, '2ª hora': 0, '3ª hora': 0, '4ª hora': 0, '5ª hora': 0, '6ª hora': 0 }
        };
        const uniqueDaysGlobal = new Set<string>();

        registros.forEach(reg => {
            const date = toZonedTime(new Date(reg.fecha_entrada), MADRID_TZ);
            uniqueDaysGlobal.add(date.toDateString());
            
            const h = date.getHours();
            const m = date.getMinutes();
            const timeVal = h * 60 + m;
            const sexo = reg.alumnos?.sexo?.toUpperCase() === 'M' ? 'F' : 'M'; // Corregir mapeo invertido del sistema

            franjas.forEach(f => {
                const startVal = f.start.h * 60 + f.start.m;
                const endVal = f.end.h * 60 + f.end.m;
                if (timeVal >= startVal && timeVal <= endVal) {
                    globalFranjaUsage.total[f.id as keyof typeof globalFranjaUsage.total]++;
                    if (sexo === 'M') globalFranjaUsage.M[f.id as keyof typeof globalFranjaUsage.M]++;
                    if (sexo === 'F') globalFranjaUsage.F[f.id as keyof typeof globalFranjaUsage.F]++;
                }
            });
        });

        const totalGlobalDays = uniqueDaysGlobal.size > 0 ? uniqueDaysGlobal.size : 1;
        
        let daysInFilter = 1;
        if (globalTimeRange === 'week') daysInFilter = 7;
        else if (globalTimeRange === 'month') daysInFilter = 30;
        else if (globalTimeRange === 'total') daysInFilter = totalGlobalDays;

        const franjaData = {
            total: Object.entries(franjaUsage.total).map(([name, value]) => {
                const avgDaily = globalFranjaUsage.total[name as keyof typeof globalFranjaUsage.total] / totalGlobalDays;
                return { name, value, average: Number((avgDaily * daysInFilter).toFixed(1)) };
            }),
            M: Object.entries(franjaUsage.M).map(([name, value]) => {
                const avgDaily = globalFranjaUsage.M[name as keyof typeof globalFranjaUsage.M] / totalGlobalDays;
                return { name, value, average: Number((avgDaily * daysInFilter).toFixed(1)) };
            }),
            F: Object.entries(franjaUsage.F).map(([name, value]) => {
                const avgDaily = globalFranjaUsage.F[name as keyof typeof globalFranjaUsage.F] / totalGlobalDays;
                return { name, value, average: Number((avgDaily * daysInFilter).toFixed(1)) };
            })
        };

        return {
            topAlumnos,
            unidadData,
            aseoData,
            sexoData,
            statusData,
            franjaData,
            totalUsos: filteredRegistrosGlobal.length,
            avgDurationMin
        };
    }, [filteredRegistrosGlobal, registros, globalTimeRange]);

    const studentStats = useMemo(() => {
        if (!selectedAlumnoId) return null;

        const alumno = uniqueAlumnos.find(a => a.id === selectedAlumnoId);
        if (!alumno) return null;

        const now = new Date();
        const alumnoIdStr = String(selectedAlumnoId);
        let filteredRegs = filteredRegistrosGlobal.filter(r => String(r.alumno_id) === alumnoIdStr);

        if (timeRange === 'week') {
            const weekAgo = subDays(now, 7);
            filteredRegs = filteredRegs.filter(r => isAfter(new Date(r.fecha_entrada), weekAgo));
        } else if (timeRange === 'month') {
            const monthAgo = subDays(now, 30);
            filteredRegs = filteredRegs.filter(r => isAfter(new Date(r.fecha_entrada), monthAgo));
        }

        const usagePerAseo: Record<string, number> = {};
        let totalDur = 0;
        let validDurCount = 0;

        filteredRegs.forEach(r => {
            const aseoName = r.aseos?.nombre || 'Desconocido';
            usagePerAseo[aseoName] = (usagePerAseo[aseoName] || 0) + 1;

            if (r.fecha_salida && r.fecha_entrada) {
                const dur = new Date(r.fecha_salida).getTime() - new Date(r.fecha_entrada).getTime();
                if (dur > 0) {
                    totalDur += dur;
                    validDurCount++;
                }
            }
        });

        const aseoData = Object.entries(usagePerAseo).map(([name, value]) => ({
            name,
            value,
            percentage: filteredRegs.length > 0 ? Math.round((value / filteredRegs.length) * 100) : 0
        }));

        return {
            alumno,
            usos: filteredRegs.length,
            avgDur: validDurCount > 0 ? (totalDur / validDurCount / 60000) : 0,
            aseoData
        };
    }, [selectedAlumnoId, timeRange, uniqueAlumnos, filteredRegistrosGlobal]);


    return (
        <div className="space-y-8 pb-12 text-slate-900 dark:text-white">
            {/* Filtros Globales y Buscador */}
            <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
                <div className="relative w-full lg:max-w-md">
                    <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
                        <div className="pl-3 text-slate-400">
                            <Search className="w-5 h-5" />
                        </div>
                        <input
                            type="text"
                            placeholder="Buscar alumno por nombre o curso..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex-1 bg-transparent border-none outline-none text-slate-900 dark:text-white placeholder:text-slate-500 py-2"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 group transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {/* Resultados búsqueda rápida */}
                    {searchQuery && filteredAlumnos.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                            {filteredAlumnos.map((a) => (
                                <button
                                    key={a.id}
                                    onClick={() => {
                                        setSelectedAlumnoId(a.id);
                                        setSearchQuery('');
                                    }}
                                    className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-b border-slate-100 dark:border-slate-800 last:border-0"
                                >
                                    <div className="h-10 w-10 bg-primary-brand/10 text-primary-brand rounded-xl flex items-center justify-center">
                                        <User className="w-5 h-5" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold text-slate-900 dark:text-white">{a.name}</p>
                                        <p className="text-xs text-slate-500 uppercase font-semibold">{a.unidad}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-x-auto max-w-full">
                    {(['today', 'yesterday', 'week', 'month', 'total'] as const).map((r) => (
                        <button
                            key={r}
                            onClick={() => {
                                setGlobalTimeRange(r);
                                setCustomDate('');
                            }}
                            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${globalTimeRange === r
                                ? 'bg-primary-brand text-white shadow-md'
                                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                        >
                            {r === 'today' ? 'Hoy' : r === 'yesterday' ? 'Ayer' : r === 'week' ? '7 Días' : r === 'month' ? '30 Días' : 'Total'}
                        </button>
                    ))}

                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${globalTimeRange === 'custom'
                        ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/40 dark:border-indigo-800'
                        : 'border-transparent hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                        <CalendarDays className={`w-4 h-4 ${globalTimeRange === 'custom' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                        <input
                            type="date"
                            value={customDate}
                            onChange={(e) => {
                                setCustomDate(e.target.value);
                                setGlobalTimeRange('custom');
                            }}
                            className={`text-[10px] font-bold uppercase bg-transparent outline-none cursor-pointer ${globalTimeRange === 'custom' ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-500'}`}
                        />
                    </div>
                </div>
            </div>

            {!stats ? (
                <div className="p-12 text-center text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
                    No hay suficientes datos para generar estadísticas en este periodo.
                </div>
            ) : (
                <>

                    {/* Vista Detallada de Alumno */}
                    {studentStats && (
                        <div className="bg-indigo-600 rounded-3xl p-8 text-white shadow-xl shadow-indigo-200 dark:shadow-none animate-in zoom-in-95 duration-300 relative overflow-hidden">
                            {/* Decoración fondo */}
                            <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
                            <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 bg-indigo-400/20 rounded-full blur-3xl pointer-events-none" />

                            <div className="relative">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                                    <div className="flex items-center gap-4">
                                        <div className="h-16 w-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/30">
                                            <User className="w-8 h-8 text-white" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <h2 className="text-2xl font-black">{studentStats.alumno.name}</h2>
                                                <Link
                                                    href={`/historial?alumno=${encodeURIComponent(studentStats.alumno.name)}&fecha=all`}
                                                    className="bg-white/10 hover:bg-white/20 transition-all px-3 py-1.5 rounded-xl text-white flex items-center gap-2 text-xs font-bold border border-white/20"
                                                >
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                    <span>Ver historial</span>
                                                </Link>
                                            </div>
                                            <p className="text-indigo-100 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                                                <Award className="w-3 h-3" />
                                                {studentStats.alumno.unidad}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex bg-white/10 p-1 rounded-xl backdrop-blur-md">
                                        {(['week', 'month', 'total'] as const).map((range) => (
                                            <button
                                                key={range}
                                                onClick={() => setTimeRange(range)}
                                                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${timeRange === range
                                                    ? 'bg-white text-indigo-600 shadow-sm'
                                                    : 'text-white hover:bg-white/10'
                                                    }`}
                                            >
                                                {range === 'week' ? '7 días' : range === 'month' ? '30 días' : 'Total'}
                                            </button>
                                        ))}
                                        <button
                                            onClick={() => setSelectedAlumnoId(null)}
                                            className="ml-2 p-2 hover:bg-white/20 rounded-lg transition-colors"
                                            title="Cerrar vista"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <div className="bg-white/10 rounded-2xl p-6 backdrop-blur-sm border border-white/10 flex flex-col justify-center">
                                        <p className="text-indigo-100 text-xs font-bold uppercase tracking-wider mb-2">Usos en este periodo</p>
                                        <p className="text-5xl font-black">{studentStats.usos}</p>
                                    </div>

                                    <div className="bg-white/10 rounded-2xl p-6 backdrop-blur-sm border border-white/10 flex flex-col justify-center">
                                        <p className="text-indigo-100 text-xs font-bold uppercase tracking-wider mb-2">Tiempo Medio</p>
                                        <div className="flex items-baseline gap-2">
                                            <p className="text-5xl font-black">{studentStats.avgDur.toFixed(1)}</p>
                                            <p className="text-xl font-bold text-indigo-100">min/uso</p>
                                        </div>
                                    </div>

                                    <div className="bg-white/10 rounded-2xl p-6 backdrop-blur-sm border border-white/10">
                                        <p className="text-indigo-100 text-xs font-bold uppercase tracking-wider mb-4">Uso por Aseo</p>
                                        <div className="space-y-3">
                                            {studentStats.aseoData.length > 0 ? (
                                                studentStats.aseoData.map((d, i) => (
                                                    <div key={i} className="space-y-1">
                                                        <div className="flex justify-between text-[10px] font-bold">
                                                            <span>{d.name.replace(/Planta/g, 'P.')}</span>
                                                            <span>{d.percentage}%</span>
                                                        </div>
                                                        <div className="w-full h-1.5 bg-indigo-900/30 rounded-full overflow-hidden">
                                                            <div className="h-full bg-white" style={{ width: `${d.percentage}%` }} />
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-xs italic text-indigo-100/60 py-4">Sin datos en este periodo</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    {/* Resumen de Tarjetas */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card
                            title="Usos Totales"
                            value={stats.totalUsos}
                            icon={<Users className="w-5 h-5 text-indigo-600" />}
                            bgColor="bg-indigo-50 dark:bg-indigo-900/20"
                        />
                        <Card
                            title="Duración Media"
                            value={`${stats.avgDurationMin} min`}
                            icon={<Clock className="w-5 h-5 text-emerald-600" />}
                            bgColor="bg-emerald-50 dark:bg-emerald-900/20"
                        />
                        <Card
                            title="Top Alumno"
                            value={stats.topAlumnos[0]?.count || 0}
                            label={stats.topAlumnos[0]?.name || '-'}
                            icon={<TrendingUp className="w-5 h-5 text-amber-600" />}
                            bgColor="bg-amber-50 dark:bg-amber-900/20"
                        />
                        <Card
                            title="Curso más activo"
                            value={stats.unidadData[0]?.name || '-'}
                            icon={<BarChart3 className="w-5 h-5 text-fuchsia-600" />}
                            bgColor="bg-fuchsia-50 dark:bg-fuchsia-900/20"
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Listado de Alumnos que más usan el aseo (PEDIDO EXPLÍCITO) */}
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="h-10 w-10 bg-amber-100 dark:bg-amber-900/20 rounded-xl flex items-center justify-center text-amber-600">
                                    <Users className="w-5 h-5" />
                                </div>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Alumnos con mayor frecuencia de uso</h2>
                            </div>
                            <div className="space-y-3 flex-1">
                                {stats.topAlumnos.map((a, i) => (
                                    <button
                                        key={i}
                                        onClick={() => {
                                            setSelectedAlumnoId(a.id);
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                        }}
                                        className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-primary-brand/20"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-500 border border-slate-200 dark:border-slate-700 group-hover:bg-white dark:group-hover:bg-slate-700 transition-colors">
                                                {i + 1}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 dark:text-white leading-tight group-hover:text-primary-brand transition-colors underline-offset-4 group-hover:underlineDecoration-primary-brand/30">{a.name}</p>
                                                <p className="text-[10px] uppercase font-bold text-slate-400 mt-1">{a.unidad}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-6 items-center">
                                            <div className="text-right hidden sm:block">
                                                <div className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">T. Medio</div>
                                                <div className="text-sm font-bold text-slate-600 dark:text-slate-400 flex items-center justify-end gap-1">
                                                    <Clock className="w-3 h-3 text-emerald-500" />
                                                    {a.avgDur.toFixed(1)} <span className="text-[10px]">min</span>
                                                </div>
                                            </div>
                                            <div className="text-right min-w-[50px]">
                                                <div className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">Usos</div>
                                                <div className="text-lg font-black text-slate-900 dark:text-white">{a.count}</div>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-primary-brand transition-all transform group-hover:translate-x-1" />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Distribución por Cursos con mayor frecuencia</h2>
                            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                                <div style={{ height: `${Math.max(stats.unidadData.length * 42, 100)}px`, minHeight: '100px' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={stats.unidadData}
                                            layout="vertical"
                                            margin={{ left: 20, right: 40, top: 0, bottom: 0 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" opacity={0.5} />
                                            <XAxis type="number" hide />
                                            <YAxis
                                                dataKey="name"
                                                type="category"
                                                axisLine={false}
                                                tickLine={false}
                                                width={100}
                                                style={{ fontSize: '12px', fontWeight: 600, fill: '#64748B' }}
                                            />
                                            <Tooltip
                                                cursor={{ fill: 'transparent' }}
                                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                            />
                                            <Bar dataKey="value" fill="var(--color-primary-brand)" radius={[0, 8, 8, 0]} barSize={24}>
                                                <LabelList dataKey="value" position="right" style={{ fill: '#64748B', fontWeight: 800, fontSize: '14px' }} offset={10} />
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* Estado de los Aseos */}
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Estado de los Aseos (Salida)</h2>
                            <div className="space-y-4 py-4">
                                {stats.statusData.map(item => {
                                    const color = item.name === 'Bueno' ? 'bg-emerald-500' : item.name === 'Regular' ? 'bg-amber-500' : 'bg-red-500';

                                    return (
                                        <div key={item.name} className="space-y-1">
                                            <div className="flex justify-between text-sm">
                                                <span className="font-semibold text-slate-700 dark:text-slate-300">{item.name}</span>
                                                <span className="font-bold text-slate-900 dark:text-white">{item.percentage}%</span>
                                            </div>
                                            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                <div className={`h-full ${color}`} style={{ width: `${item.percentage}%` }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="mt-20 p-4 bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl flex items-center gap-3">
                                <User className="w-6 h-6 text-indigo-600" />
                                <p className="text-xs text-indigo-700 dark:text-indigo-400 font-medium">
                                    Los datos reflejan exclusivamente registros con salida completada en el periodo seleccionado.
                                </p>
                            </div>
                        </div>

                        {/* Gráfico de Franjas Horarias */}
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm md:col-span-2">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-indigo-500" />
                                    Uso por Franjas Horarias
                                </h2>
                                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                                    <button
                                        onClick={() => setFranjaGenderFilter('total')}
                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${franjaGenderFilter === 'total' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'}`}
                                    >Total</button>
                                    <button
                                        onClick={() => setFranjaGenderFilter('M')}
                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${franjaGenderFilter === 'M' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500'}`}
                                    >Chicos</button>
                                    <button
                                        onClick={() => setFranjaGenderFilter('F')}
                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${franjaGenderFilter === 'F' ? 'bg-pink-500 text-white shadow-sm' : 'text-slate-500'}`}
                                    >Chicas</button>
                                </div>
                            </div>

                            <div className="h-80 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={stats.franjaData[franjaGenderFilter]}
                                        margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
                                        <XAxis
                                            dataKey="name"
                                            axisLine={false}
                                            tickLine={false}
                                            style={{ fontSize: '11px', fontWeight: 600, fill: '#64748B' }}
                                        />
                                        <YAxis hide />
                                        <Tooltip
                                            cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                                            content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                    const val = payload[0].value as number;
                                                    const avg = payload[1]?.value as number;
                                                    const currentData = stats.franjaData[franjaGenderFilter];
                                                    const totalForFilter = currentData.reduce((a, b) => a + b.value, 0);
                                                    const pct = totalForFilter > 0 ? ((val / totalForFilter) * 100).toFixed(1) : 0;
                                                    return (
                                                        <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 shadow-xl">
                                                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">{payload[0].payload.name}</p>
                                                            <div className="flex items-baseline gap-2">
                                                                <span className="text-lg font-black text-slate-900 dark:text-white">{val}</span>
                                                                <span className="text-xs font-bold text-indigo-500">{pct}% actual</span>
                                                            </div>
                                                            {avg !== undefined && (
                                                                <div className="mt-1 flex items-baseline gap-2">
                                                                    <span className="text-sm font-bold text-slate-400">Media: {avg}</span>
                                                                </div>
                                                            )}
                                                            <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold">Registros</p>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        <Legend 
                                            verticalAlign="top" 
                                            align="right" 
                                            iconType="circle"
                                            wrapperStyle={{ paddingBottom: '10px', fontSize: '12px', fontWeight: 'bold' }}
                                        />
                                        <Bar
                                            dataKey="value"
                                            name="Actual"
                                            radius={[6, 6, 0, 0]}
                                            maxBarSize={40}
                                            fill={franjaGenderFilter === 'F' ? '#ec4899' : franjaGenderFilter === 'M' ? '#4f46e5' : 'var(--color-primary-brand)'}
                                        >
                                            {stats.franjaData[franjaGenderFilter].map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={franjaGenderFilter === 'F' ? '#ec4899' : franjaGenderFilter === 'M' ? '#4f46e5' : 'var(--color-primary-brand)'}
                                                />
                                            ))}
                                            <LabelList dataKey="value" position="top" style={{ fill: '#64748B', fontWeight: 800, fontSize: '12px' }} offset={10} />
                                        </Bar>
                                        <Bar
                                            dataKey="average"
                                            name="Media Histórica"
                                            radius={[6, 6, 0, 0]}
                                            maxBarSize={40}
                                            fill="#94a3b8"
                                            opacity={0.6}
                                        >
                                            <LabelList dataKey="average" position="top" style={{ fill: '#94a3b8', fontWeight: 800, fontSize: '11px' }} offset={10} />
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Gráfico de Género */}
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Distribución por Género</h2>
                            <div className="h-75 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={stats.sexoData}
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                            cx="50%"
                                            cy="45%"
                                            label={({ percent }) => `${((percent || 0) * 100).toFixed(0)}%`}
                                        >
                                            {stats.sexoData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={index === 0 ? 'var(--color-primary-brand)' : '#ec4899'} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                        />
                                        <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ paddingTop: '25px' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Uso de Aseos */}
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Uso de Aseos</h2>
                            <div className="h-90 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={stats.aseoData}
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                            cx="50%"
                                            cy="45%"
                                            label={({ percent }) => `${((percent || 0) * 100).toFixed(0)}%`}
                                        >
                                            {stats.aseoData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                        />
                                        <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ paddingTop: '10px' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

function Card({ title, value, label, icon, bgColor }: { title: string, value: string | number, label?: string, icon: React.ReactNode, bgColor: string }) {
    return (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
            <div className="flex justify-between items-start">
                <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</p>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{value}</h3>
                    {label && <p className="text-[10px] font-bold text-slate-500 truncate max-w-[120px]">{label}</p>}
                </div>
                <div className={`h-12 w-12 ${bgColor} rounded-2xl flex items-center justify-center`}>
                    {icon}
                </div>
            </div>
        </div>
    );
}
