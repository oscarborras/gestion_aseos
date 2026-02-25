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

    const nuevosNombresList = alumnosData.map(a => a.alumno)
    const nuevosCursosList = alumnosData.map(a => a.unidad || 'Sin Curso')

    let nombresFinales = nuevosNombresList
    let cursosFinales = nuevosCursosList

    if (aseoActual?.ocupado_por) {
        const nombresPrevios = aseoActual.ocupado_por.split('; ')
        const cursosPrevios = aseoActual.curso_alumno?.split('; ') || []
        // Filtrar para no añadir duplicados si ya estaban (por seguridad)
        const nombresParaAnadir = nuevosNombresList.filter(n => !nombresPrevios.includes(n))
        // Nota: esto es una simplificación, en un sistema real querríamos ser más precisos con los cursos
        nombresFinales = [...nombresPrevios, ...nombresParaAnadir]
        // Para los cursos, añadimos solo los que correspondan a los nombres añadidos
        const cursosParaAnadir = nuevosCursosList.filter((c, i) => !nombresPrevios.includes(nuevosNombresList[i]))
        cursosFinales = [...cursosPrevios, ...cursosParaAnadir]
    }

    const { error: updateError } = await supabase
        .from('aseos')
        .update({
            estado_id: 2, // 2 = Ocupado
            ocupado_por: nombresFinales.join('; '),
            curso_alumno: cursosFinales.join('; '),
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

    // 1. Obtener el alumno_id del registro para luego limpiar la lista de espera
    const { data: registroActual } = await supabase
        .from('registros')
        .select('alumno_id')
        .eq('id', registroId)
        .single()

    // 2. Actualizar el registro actual marcando la salida
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

    // 3. Eliminar al alumno de la lista de espera para que pueda volver a pedir turno
    if (registroActual?.alumno_id) {
        await supabase
            .from('lista_espera')
            .delete()
            .eq('alumno_id', registroActual.alumno_id)
            .in('estado', ['en_uso', 'notificado'])
    }

    // 4. Comprobar cuántos alumnos quedan en ese aseo
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
        // Reconstruir los strings de ocupado_por y curso_alumno usando el separador consistente '; '
        const nombres = alumnosRestantes.map((r: any) => r.alumnos.alumno).join('; ')
        const cursos = alumnosRestantes.map((r: any) => r.alumnos.unidad || 'Sin Curso').join('; ')

        await supabase.from('aseos').update({
            estado_id: 2, // Sigue ocupado
            ocupado_por: nombres,
            curso_alumno: cursos
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
    revalidatePath('/entregar')

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
    revalidatePath('/entregar')

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

export async function entregarTurno(waitingId: number, alumnoId: string, aseoId: number) {
    const supabase = await createClient()

    // 1. Obtener datos del alumno
    const { data: alumno } = await supabase.from('alumnos').select('*').eq('id', alumnoId).single()
    if (!alumno) return { error: 'Alumno no encontrado' }

    // 2. Marcar como 'en_uso' en la lista de espera
    const { error: waitError } = await supabase
        .from('lista_espera')
        .update({ estado: 'en_uso' })
        .eq('id', waitingId)

    if (waitError) return { error: 'Error al actualizar lista de espera' }

    // 3. Registrar entrada en el aseo
    const { error: regError } = await supabase
        .from('registros')
        .insert({
            alumno_id: alumnoId,
            aseo_id: aseoId
        })

    if (regError) return { error: 'Error al registrar entrada' }

    // 4. Actualizar estado del aseo (Añadiendo a lo que ya hubiera)
    const { data: aseoActual } = await supabase.from('aseos').select('ocupado_por, curso_alumno').eq('id', aseoId).single()

    let ocupado_por = alumno.alumno
    let curso_alumno = alumno.unidad || 'Sin Curso'

    if (aseoActual?.ocupado_por) {
        const nombresPrevios = aseoActual.ocupado_por.split('; ')
        const cursosPrevios = aseoActual.curso_alumno?.split('; ') || []

        if (!nombresPrevios.includes(alumno.alumno)) {
            ocupado_por = [...nombresPrevios, alumno.alumno].join('; ')
            curso_alumno = [...cursosPrevios, alumno.unidad || 'Sin Curso'].join('; ')
        } else {
            ocupado_por = aseoActual.ocupado_por
            curso_alumno = aseoActual.curso_alumno || 'Sin Curso'
        }
    }

    const { error: aseoError } = await supabase
        .from('aseos')
        .update({
            estado_id: 2, // Ocupado
            ocupado_por,
            curso_alumno,
            ultimo_cambio: new Date().toISOString()
        })
        .eq('id', aseoId)

    if (aseoError) return { error: 'Error al ocupar el aseo' }

    revalidatePath('/')
    revalidatePath('/entregar')
    revalidatePath('/entrada')
    revalidatePath('/solicitud')
    revalidatePath('/dashboard')

    return { success: true }
}

export async function entregarTurnoGrupo(alumnos: { waitingId: number, alumnoId: string }[], aseoId: number) {
    const supabase = await createClient()

    // Procesar todos en una transacción o secuencialmente pero con cuidado
    // Para simplificar y evitar fallos parciales, lo haremos uno a uno pero 
    // al final revalidaremos todo

    for (const item of alumnos) {
        const res = await entregarTurno(item.waitingId, item.alumnoId, aseoId)
        if (res.error) return { error: res.error as string }
    }

    return { success: true }
}

export async function getUserRoles() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    // Primero obtenemos los perfil_ids del usuario
    const { data: userRolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('perfil_id')
        .eq('user_id', user.id)

    if (rolesError || !userRolesData || userRolesData.length === 0) return []

    // Luego obtenemos los nombres de los perfiles
    const perfilIds = userRolesData.map((r: any) => r.perfil_id)
    const { data: perfilesData } = await supabase
        .from('perfiles')
        .select('nombre')
        .in('id', perfilIds)

    return perfilesData?.map((p: any) => p.nombre) || []
}

export async function updateUserRoles(targetUserId: string, roleIds: number[]) {
    const supabase = await createClient()

    // Verificar si el que llama es Admin
    const myRoles = await getUserRoles()
    if (!myRoles.includes('Admin')) {
        return { error: 'No tienes permiso para realizar esta acción' }
    }

    // 1. Eliminar roles actuales del usuario objetivo
    const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', targetUserId)

    if (deleteError) return { error: deleteError.message }

    // 2. Insertar los nuevos roles
    if (roleIds.length > 0) {
        const rolesToInsert = roleIds.map(perfil_id => ({
            user_id: targetUserId,
            perfil_id
        }))

        const { error: insertError } = await supabase
            .from('user_roles')
            .insert(rolesToInsert)

        if (insertError) return { error: insertError.message }
    }

    revalidatePath('/mantenimiento/usuarios')
    return { success: true }
}
