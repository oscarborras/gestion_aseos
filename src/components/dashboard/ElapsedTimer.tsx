'use client'

import { useState, useEffect } from 'react'

export default function ElapsedTimer({ startTime }: { startTime: string | null }) {
    const [elapsed, setElapsed] = useState('0m 00s')

    useEffect(() => {
        if (!startTime) return

        const calculateElapsed = () => {
            const start = new Date(startTime).getTime()
            const now = new Date().getTime()
            const diff = Math.max(0, now - start)

            const mins = Math.floor(diff / 60000)
            const secs = Math.floor((diff % 60000) / 1000)

            setElapsed(`${mins}m ${secs.toString().padStart(2, '0')}s`)
        }

        calculateElapsed()
        const interval = setInterval(calculateElapsed, 1000)

        return () => clearInterval(interval)
    }, [startTime])

    if (!startTime) return <span className="text-sm font-bold tabular-nums">0m 00s</span>

    return (
        <span className="text-sm font-bold tabular-nums">
            {elapsed}
        </span>
    )
}
