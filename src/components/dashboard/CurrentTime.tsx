'use client'

import { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function CurrentTime() {
    const [now, setNow] = useState(new Date())

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 60000)
        return () => clearInterval(timer)
    }, [])

    return (
        <div className="flex items-center gap-4 bg-white dark:bg-gray-900 px-6 py-3 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 transition-all hover:shadow-md group">
            <div className="h-10 w-10 rounded-xl bg-primary-brand/10 flex items-center justify-center text-primary-brand group-hover:scale-110 transition-transform">
                <Clock className="w-5 h-5" />
            </div>
            <div className="text-left">
                <p className="text-2xl font-black text-gray-900 dark:text-white leading-none mb-1">
                    {format(now, 'HH:mm')}
                </p>
                <p className="text-[10px] font-bold text-primary-brand/70 dark:text-primary-brand/50 uppercase tracking-widest leading-none">
                    {format(now, "EEEE, d MMM", { locale: es })}
                </p>
            </div>
        </div>
    )
}
