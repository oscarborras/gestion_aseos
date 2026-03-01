'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function DashboardRealtime() {
    const router = useRouter()

    useEffect(() => {
        const supabase = createClient()

        // Escuchar cambios en aseos (estado_id, ocupado_por, etc.)
        const aseosChannel = supabase
            .channel('dashboard-aseos-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'aseos'
                },
                () => {
                    router.refresh()
                }
            )
            .subscribe()

        // Escuchar cambios en registros (entradas y salidas)
        // Esto cubre tanto la entrega de llaves como la devolución
        const registrosChannel = supabase
            .channel('dashboard-registros-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'registros'
                },
                () => {
                    router.refresh()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(aseosChannel)
            supabase.removeChannel(registrosChannel)
        }
    }, [router])

    return null
}
