'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { resend } from '@/lib/resend'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

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

export async function anularTurno(waitingId: number) {
    const supabase = await createClient()

    // 1. Obtener los datos completos del turno y del alumno antes de borrarlo
    const { data: turno, error: fetchError } = await supabase
        .from('lista_espera')
        .select(`
            id,
            alumno_id,
            fecha_solicitud,
            alumnos (
                alumno,
                unidad,
                sexo
            )
        `)
        .eq('id', waitingId)
        .single()

    if (fetchError || !turno) {
        return { error: 'No se encontró el turno a anular' }
    }

    const alumno = (turno.alumnos as any)

    // 2. Obtener el usuario actual para registrar quién anula
    const { data: { user } } = await supabase.auth.getUser()

    // 3. Guardar una copia del turno anulado
    const { error: insertError } = await supabase
        .from('turnos_anulados')
        .insert({
            alumno_id: turno.alumno_id,
            alumno_nombre: alumno?.alumno || 'Desconocido',
            alumno_unidad: alumno?.unidad || null,
            alumno_sexo: alumno?.sexo || null,
            fecha_solicitud: turno.fecha_solicitud,
            fecha_anulacion: new Date().toISOString(),
            anulado_por: user?.id || null
        })

    if (insertError) {
        console.error('Error al guardar turno anulado:', insertError)
        return { error: 'Error al registrar la anulación' }
    }

    // 3. Eliminar el turno de la lista de espera
    const { error: deleteError } = await supabase
        .from('lista_espera')
        .delete()
        .eq('id', waitingId)

    if (deleteError) {
        return { error: 'Error al eliminar de la lista de espera' }
    }

    revalidatePath('/')
    revalidatePath('/entregar')

    return { success: true }
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
    const { data: aseoActual } = await supabase.from('aseos').select('nombre, ocupado_por, curso_alumno').eq('id', aseoId).single()

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

    // 5. Comprobar si el alumno está en seguimiento y enviar email
    try {
        const { data: seguimiento } = await supabase
            .from('aseos_seguimiento' as any)
            .select('*')
            .eq('alumno_id', alumnoId)
            .single()

        if (seguimiento) {
            const config = await getAseosConfig() as any
            if (config?.email_seguimiento) {
                const now = new Date()
                const formattedTime = format(now, "HH:mm 'de' d 'de' MMMM", { locale: es })
                
                await resend.emails.send({
                    from: 'Aseos Julio Verne <onboarding@resend.dev>',
                    to: config.email_seguimiento,
                    subject: `⚠️ Aviso de Seguimiento: ${alumno.alumno}`,
                    html: `
                        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                            <div style="background-color: #f1f5f9; padding: 24px; border-bottom: 1px solid #e2e8f0;">
                                <h2 style="color: #1e293b; margin: 0; font-size: 20px;">Aviso de Seguimiento</h2>
                            </div>
                            <div style="padding: 24px; background-color: #ffffff;">
                                <p style="color: #64748b; margin: 0 0 16px 0;">Se ha registrado una solicitud de acceso al aseo para un alumno en seguimiento:</p>
                                <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #f1f5f9;">
                                    <p style="margin: 0 0 8px 0; font-size: 16px;"><strong>Alumno:</strong> ${alumno.alumno}</p>
                                    <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Curso:</strong> ${alumno.unidad || 'Sin curso'}</p>
                                    <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Aseo:</strong> ${aseoActual?.nombre || 'Desconocido'}</p>
                                    <p style="margin: 0; font-size: 14px;"><strong>Hora:</strong> ${formattedTime}</p>
                                </div>
                                <p style="color: #94a3b8; font-size: 12px; margin-top: 24px;">Este es un mensaje automático del sistema de gestión de aseos.</p>
                            </div>
                        </div>
                    `
                });
            }
        }
    } catch (err) {
        console.error('Error al enviar email de seguimiento:', err)
        // No bloqueamos la acción si falla el email, solo informamos en consola
    }

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

export async function getAlumnosSeguimiento() {
    const supabase = await createClient()

    const { data: seguimiento, error } = await supabase
        .from('aseos_seguimiento' as any)
        .select(`
            alumno_id,
            created_at,
            alumnos (
                id,
                alumno,
                unidad
            )
        `)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching seguimiento:', error)
        return []
    }

    return (seguimiento || []).map((s: any) => ({
        id: s.alumno_id,
        name: s.alumnos?.alumno || 'Desconocido',
        unidad: s.alumnos?.unidad || 'Sin curso',
        created_at: s.created_at
    }))
}

export async function addAlumnoSeguimiento(alumnoId: string) {
    const supabase = await createClient()

    // Comprobar si ya existe para evitar error de Supabase
    const { data: existing } = await supabase
        .from('aseos_seguimiento' as any)
        .select('alumno_id')
        .eq('alumno_id', alumnoId)
        .single()

    if (existing) {
        return { error: 'Este alumno ya está en el registro de seguimiento' }
    }

    const { error } = await supabase
        .from('aseos_seguimiento' as any)
        .insert({ alumno_id: alumnoId })

    if (error) {
        console.error('Error adding to seguimiento:', error)
        return { error: 'Ocurrió un error al añadir al alumno' }
    }

    revalidatePath('/seguimiento')
    return { success: true }
}

export async function removeAlumnoSeguimiento(alumnoId: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('aseos_seguimiento' as any)
        .delete()
        .eq('alumno_id', alumnoId)

    if (error) {
        console.error('Error removing from seguimiento:', error)
        return { error: 'No se pudo eliminar al alumno del registro' }
    }

    revalidatePath('/seguimiento')
    return { success: true }
}

export async function getAllAlumnos() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('alumnos')
        .select('id, alumno, unidad')
        .order('alumno', { ascending: true })

    if (error) {
        console.error('Error fetching all alumnos:', error)
        return []
    }

    return data.map(a => ({
        id: String(a.id),
        name: a.alumno,
        unidad: a.unidad
    }))
}

export async function getAseosConfig() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('aseos_config' as any)
        .select('*')
        .eq('id', 1)
        .single()

    if (error) {
        console.error('Error fetching aseos config:', error)
        return null
    }

    return data
}

export async function updateSeguimientoEmail(email: string) {
    const supabase = await createClient()
    
    const myRoles = await getUserRoles()
    if (!myRoles.includes('Admin') && !myRoles.includes('Directiva')) {
        return { error: 'No tienes permiso para realizar esta acción' }
    }

    const { error } = await supabase
        .from('aseos_config' as any)
        .update({ email_seguimiento: email })
        .eq('id', 1)

    if (error) {
        console.error('Error updating seguimiento email:', error)
        return { error: 'No se pudo actualizar el email de seguimiento' }
    }

    revalidatePath('/mantenimiento')
    return { success: true }
}
