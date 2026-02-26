'use client'

import { useMemo, useState } from 'react'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts'
import { Users, Clock, Calendar, BarChart3, TrendingUp, User, Search, X, ChevronRight, Award } from 'lucide-react'

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

    const uniqueAlumnos = useMemo(() => {
        const alumnosMap: Record<string, { id: string, name: string, unidad: string }> = {};
        registros.forEach(reg => {
            if (reg.alumno_id && !alumnosMap[reg.alumno_id]) {
                alumnosMap[reg.alumno_id] = {
                    id: reg.alumno_id,
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
        if (!registros.length) return null;

        // 1. Uso por Alumno (Top 10)
        const usagePerAlumno: Record<string, { name: string, count: number, unidad: string, totalDur: number, validDurCount: number }> = {};
        // 2. Uso por Unidad (Curso)
        const usagePerUnidad: Record<string, number> = {};
        // 3. Uso por Aseo
        const usagePerAseo: Record<string, number> = {};
        // 4. Uso por Género (Sexo)
        const usagePerSexo: Record<string, number> = { 'Chicos': 0, 'Chicas': 0 };
        // 5. Duración media
        let totalDurationMs = 0;
        let validDurationCount = 0;

        registros.forEach(reg => {
            // Per Alumno
            const alumnoId = reg.alumno_id;
            const alumnoName = reg.alumnos?.alumno || 'Desconocido';
            const unidad = reg.alumnos?.unidad || 'N/A';
            if (!usagePerAlumno[alumnoId]) {
                usagePerAlumno[alumnoId] = { name: alumnoName, count: 0, unidad, totalDur: 0, validDurCount: 0 };
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
            .slice(0, 8);

        const aseoData = Object.entries(usagePerAseo)
            .map(([name, value]) => ({ name, value }));

        const sexoData = Object.entries(usagePerSexo)
            .map(([name, value]) => ({ name, value }));

        const avgDurationMin = validDurationCount > 0
            ? Math.round(totalDurationMs / validDurationCount / 60000 * 10) / 10
            : 0;

        return {
            topAlumnos,
            unidadData,
            aseoData,
            sexoData,
            totalUsos: registros.length,
            avgDurationMin
        };
    }, [registros]);

    const studentStats = useMemo(() => {
        if (!selectedAlumnoId) return null;

        const alumno = uniqueAlumnos.find(a => a.id === selectedAlumnoId);
        if (!alumno) return null;

        const now = new Date();
        let filteredRegs = registros.filter(r => r.alumno_id === selectedAlumnoId);

        if (timeRange === 'week') {
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            filteredRegs = filteredRegs.filter(r => new Date(r.fecha_entrada) >= weekAgo);
        } else if (timeRange === 'month') {
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            filteredRegs = filteredRegs.filter(r => new Date(r.fecha_entrada) >= monthAgo);
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
    }, [selectedAlumnoId, timeRange, uniqueAlumnos, registros]);

    if (!stats) {
        return (
            <div className="p-12 text-center text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
                No hay suficientes datos para generar estadísticas todavía.
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-12">
            {/* Buscador de Alumnos */}
            <div className="relative max-w-2xl">
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
                            <X className="w-4 h-4 group-hover:text-slate-600" />
                        </button>
                    )}
                </div>

                {filteredAlumnos.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                        {filteredAlumnos.map(a => (
                            <button
                                key={a.id}
                                onClick={() => {
                                    setSelectedAlumnoId(a.id);
                                    setSearchQuery('');
                                }}
                                className="w-full text-left p-4 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between group transition-colors border-b border-slate-100 dark:border-slate-800 last:border-none"
                            >
                                <div>
                                    <p className="font-bold text-slate-900 dark:text-white">{a.name}</p>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{a.unidad}</p>
                                </div>
                                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-primary-brand transform group-hover:translate-x-1 transition-all" />
                            </button>
                        ))}
                    </div>
                )}
            </div>

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
                                    <h2 className="text-2xl font-black">{studentStats.alumno.name}</h2>
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
                                                    <span>{d.name}</span>
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
                            <div key={i} className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-500 border border-slate-200 dark:border-slate-700">
                                        {i + 1}
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900 dark:text-white leading-tight group-hover:text-primary-brand transition-colors">{a.name}</p>
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
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Gráfico de Cursos (Unidades) */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Distribución por Cursos</h2>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.unidadData} layout="vertical" margin={{ left: 20, right: 30 }}>
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
                                <Bar dataKey="value" fill="var(--color-primary-brand)" radius={[0, 8, 8, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* Gráfico de Aseos */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Uso de Aseos</h2>
                    <div className="h-80 w-full">
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

                {/* Gráfico de Género */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Distribución por Género</h2>
                    <div className="h-70 w-full">
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

                {/* Evolución Temporal (Dummy logic for now based on recent records) */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm col-span-1 md:col-span-2 lg:col-span-1">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Estado de los Aseos (Salida)</h2>
                    <div className="space-y-4 py-4">
                        {['Bueno', 'Regular', 'Malo'].map(status => {
                            const count = registros.filter(r => r.estado_salida === status).length;
                            const percentage = Math.round((count / registros.length) * 100) || 0;
                            const color = status === 'Bueno' ? 'bg-emerald-500' : status === 'Regular' ? 'bg-amber-500' : 'bg-red-500';

                            return (
                                <div key={status} className="space-y-1">
                                    <div className="flex justify-between text-sm">
                                        <span className="font-semibold text-slate-700 dark:text-slate-300">{status}</span>
                                        <span className="font-bold text-slate-900 dark:text-white">{percentage}%</span>
                                    </div>
                                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <div className={`h-full ${color}`} style={{ width: `${percentage}%` }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="mt-20 p-4 bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl flex items-center gap-3">
                        <User className="w-6 h-6 text-indigo-600" />
                        <p className="text-xs text-indigo-700 dark:text-indigo-400 font-medium">
                            Los datos reflejan exclusivamente registros con salida completada.
                        </p>
                    </div>
                </div>
            </div>
        </div >
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
