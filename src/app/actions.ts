'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function registrarEntrada(formData: FormData) {
    const supabase = await createClient()

    const aseoIdStr = formData.get('aseo_id')?.toString()
    const alumnosStr = formData.get('alumnos')?.toString() // JSON string of selected student IDs
    const observaciones = formData.get('observaciones')?.toString()

    if (!aseoIdStr || !alumnosStr) {
        return { error: 'Faltan datos obligatorios' }
    }

    const aseoId = parseInt(aseoIdStr, 10)
    const alumnosIds: string[] = JSON.parse(alumnosStr)

    if (alumnosIds.length === 0) {
        return { error: 'Debe seleccionar al menos un alumno' }
    }

    // 1. Obtener información de los alumnos para guardarla concatenada en aseos
    const { data: alumnosData, error: errorAlumnos } = await supabase
        .from('alumnos')
        .select('id, alumno, unidad')
        .in('id', alumnosIds)

    if (errorAlumnos || !alumnosData) {
        return { error: 'Error al obtener datos de los alumnos' }
    }

    // 2. Insertar registros
    const inserts = alumnosData.map(a => ({
        alumno_id: a.id,
        aseo_id: aseoId,
        observaciones_entrada: observaciones
    }))

    const { error: insertError } = await supabase.from('registros').insert(inserts)

    if (insertError) {
        return { error: 'Error al crear los registros de entrada' }
    }

    // 3. Actualizar estado del aseo
    // Recuperar info actual del aseo para concatenar si ya tenía gente
    const { data: aseoActual } = await supabase.from('aseos').select('ocupado_por, curso_alumno').eq('id', aseoId).single()

    const nuevosNombres = alumnosData.map(a => a.alumno).join('; ')
    const nuevosCursos = alumnosData.map(a => a.unidad || 'Sin Curso').join('; ')

    let ocupado_por = nuevosNombres
    let curso_alumno = nuevosCursos

    if (aseoActual?.ocupado_por) {
        ocupado_por = `${aseoActual.ocupado_por}; ${nuevosNombres}`
    }
    if (aseoActual?.curso_alumno) {
        curso_alumno = `${aseoActual.curso_alumno}; ${nuevosCursos}`
    }

    const { error: updateError } = await supabase
        .from('aseos')
        .update({
            estado_id: 2, // 2 = Ocupado
            ocupado_por,
            curso_alumno,
            ultimo_cambio: new Date().toISOString()
        })
        .eq('id', aseoId)

    if (updateError) {
        return { error: 'Error al actualizar el estado del aseo' }
    }

    revalidatePath('/')
    revalidatePath('/entrada')

    return { success: true }
}

export async function registrarSalida(formData: FormData) {
    const supabase = await createClient()

    const registroIdStr = formData.get('registro_id')?.toString()
    const aseoIdStr = formData.get('aseo_id')?.toString()
    const estadoSalida = formData.get('estado')?.toString()
    const observaciones = formData.get('observaciones')?.toString()

    if (!registroIdStr || !aseoIdStr || !estadoSalida) {
        return { error: 'Faltan datos obligatorios' }
    }

    const registroId = parseInt(registroIdStr, 10)
    const aseoId = parseInt(aseoIdStr, 10)

    // 1. Actualizar el registro actual marcando la salida
    const { error: updateRegistroError } = await supabase
        .from('registros')
        .update({
            fecha_salida: new Date().toISOString(),
            estado_salida: estadoSalida,
            observaciones_salida: observaciones
        })
        .eq('id', registroId)

    if (updateRegistroError) {
        return { error: 'Error al registrar la salida' }
    }

    // 2. Comprobar cuántos alumnos quedan en ese aseo
    const { data: alumnosRestantes } = await supabase
        .from('registros')
        .select(`
      alumno_id,
      alumnos ( alumno, unidad )
    `)
        .eq('aseo_id', aseoId)
        .is('fecha_salida', null)

    const quedanAlumnos = alumnosRestantes && alumnosRestantes.length > 0;

    if (quedanAlumnos) {
        // Reconstruir los strings de ocupado_por y curso_alumno
        const nuevosNombres = alumnosRestantes.map((r: any) => r.alumnos.alumno).join(', ')
        const nuevosCursos = alumnosRestantes.map((r: any) => r.alumnos.unidad || 'Sin Curso').join(', ')

        await supabase.from('aseos').update({
            estado_id: 2, // Sigue ocupado
            ocupado_por: nuevosNombres,
            curso_alumno: nuevosCursos
        }).eq('id', aseoId)
    } else {
        // Queda completamente libre
        await supabase.from('aseos').update({
            estado_id: 1, // Libre
            ocupado_por: null,
            curso_alumno: null
        }).eq('id', aseoId)
    }

    revalidatePath('/')
    revalidatePath('/salida')

    return { success: true }
}

export async function toggleMantenimiento(aseoId: number, isMantenimiento: boolean) {
    const supabase = await createClient()

    // Verify auth constraint server-side as well
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: 'No autorizado' }
    }

    const nuevoEstado = isMantenimiento ? 3 : 1; // 3 = Mantenimiento, 1 = Disponible

    const { error } = await supabase
        .from('aseos')
        .update({
            estado_id: nuevoEstado,
            ocupado_por: null,
            curso_alumno: null
        })
        .eq('id', aseoId)

    if (error) {
        return { error: 'Error al actualizar el estado del aseo' }
    }

    revalidatePath('/')
    revalidatePath('/mantenimiento')
    revalidatePath('/entrada')

    return { success: true }
}

export async function insertAlumnos(alumnosRaw: { nombreCompleto: string, nombreCurso: string, sexo: string }[]) {
    const supabase = await createClient()

    // Verify auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: 'No autorizado' }
    }

    // 1. Obtener alumnos existentes para evitar duplicados
    const { data: existingAlumnos } = await supabase
        .from('alumnos')
        .select('alumno, unidad')

    const existingKeys = new Set(
        existingAlumnos?.map(a => `${a.alumno.toLowerCase()}|${a.unidad.toLowerCase()}`) || []
    )

    // 2. Preparar inserción filtrando duplicados
    const inserts = alumnosRaw
        .map(a => ({
            alumno: a.nombreCompleto.trim(),
            unidad: a.nombreCurso.trim(),
            sexo: a.sexo.trim()
        }))
        .filter(a => {
            const key = `${a.alumno.toLowerCase()}|${a.unidad.toLowerCase()}`
            return !existingKeys.has(key)
        })

    if (inserts.length === 0) {
        return { error: 'No hay alumnos nuevos para añadir.' + (alumnosRaw.length > 0 ? ' (Los datos ya existen)' : '') }
    }

    // 3. Insertar nuevos alumnos
    const { error: insertError } = await supabase
        .from('alumnos')
        .insert(inserts)

    if (insertError) {
        console.error('Insert error:', insertError)
        return { error: 'Ocurrió un error guardando los alumnos.' }
    }

    // Revalidar rutas
    revalidatePath('/entrada')
    revalidatePath('/alumnos/importar')

    return { success: true, count: inserts.length }
}

export async function solicitarUsoAseo(alumnosIds: string[]) {
    const supabase = await createClient()

    if (!alumnosIds || alumnosIds.length === 0) {
        return { error: 'Debe seleccionar al menos un alumno' }
    }

    const inserts = alumnosIds.map(id => ({
        alumno_id: id,
        estado: 'esperando'
    }))

    const { error } = await supabase
        .from('lista_espera')
        .insert(inserts)

    if (error) {
        console.error('Error al solicitar uso de aseo:', error)
        return { error: 'No se pudo realizar la solicitud' }
    }

    revalidatePath('/')
    revalidatePath('/solicitud')

    return { success: true }
}
