// Configuración de Supabase
const supabaseUrl = 'https://klmjmlhwuzhymrplemgw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtsbWptbGh3dXpoeW1ycGxlbWd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1OTMyNjQsImV4cCI6MjA4NzE2OTI2NH0.xFWMvUJa9n9TBcBG1WSeqCGiWBaCAtCU9aY7GXk4W6E';

const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

// Variables Globales
let targetEventId = null;

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Obtener ID del evento desde URL
    const params = new URLSearchParams(window.location.search);
    const eventIdParam = params.get('id');

    if (!eventIdParam || isNaN(parseInt(eventIdParam))) {
        showError('URL Inválida', 'No se especificó un evento válido en el enlace.');
        return;
    }

    targetEventId = parseInt(eventIdParam);

    // 2. Cargar detalles del evento desde Supabase
    try {
        const { data: evento, error } = await supabaseClient
            .from('eventos')
            .select('*')
            .eq('id', targetEventId)
            .single();

        if (error || !evento) throw new Error('Evento no encontrado');

        renderEventDetails(evento);
    } catch (err) {
        console.error(err);
        showError('Evento no encontrado', 'El evento al que intentas inscribirte ya no está disponible o el enlace caducó.');
    }
});

function renderEventDetails(evento) {
    document.getElementById('ui-event-name').textContent = evento.nombre;

    // Formatear Fecha(s)
    let dateText = 'Fecha por definir';
    let timeText = '';
    try {
        if (evento.horario) {
            const horarios = typeof evento.horario === 'string' ? JSON.parse(evento.horario) : evento.horario;
            if (horarios.length > 0) {
                const datesArray = horarios.map(h => {
                    if (!h.fecha) return null;
                    const parts = h.fecha.split('-');
                    return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : h.fecha;
                }).filter(Boolean);

                if (datesArray.length > 0) {
                    dateText = datesArray.join(', ');
                }

                const first = horarios[0];
                if (first.inicio) {
                    timeText = `Inicio: ${first.inicio}`;
                    if (first.fin) {
                        timeText += ` - Fin: ${first.fin}`;
                    }
                }
            }
        }
    } catch (e) {
        console.warn("Horario invalid", e);
    }

    document.getElementById('ui-event-date').textContent = dateText;

    if (timeText) {
        document.getElementById('ui-event-time').textContent = timeText;
        document.getElementById('ui-event-time').parentElement.style.display = 'flex';
    } else {
        document.getElementById('ui-event-time').parentElement.style.display = 'none';
    }

    // Sede / Modalidad
    const modality = evento.modalidad || 'Virtual';
    let locText = "";

    if (modality === 'Presencial') {
        locText = evento.sedes || 'Sede por definir';
    } else if (modality === 'Virtual') {
        locText = 'Vía Zoom / Meet';
    } else if (modality === 'Mixto' || modality.toLowerCase().includes('hibrido') || modality.toLowerCase().includes('híbrido')) {
        locText = `${evento.sedes || 'Sede Presencial'} y Vía Zoom / Meet`;
    } else {
        locText = `${modality} - ${evento.sedes || ''}`;
    }

    document.getElementById('ui-event-location').textContent = locText;

    // Mostrar formulario y detalles
    document.getElementById('ui-event-details').style.display = 'flex';
    document.getElementById('main-form-container').style.display = 'block';
}

function showError(title, message) {
    document.getElementById('error-title').textContent = title;
    document.getElementById('error-message').textContent = message;
    document.getElementById('error-container').style.display = 'block';
    document.getElementById('main-form-container').style.display = 'none';
}

// 3. Manejar Envío del Formulario
document.getElementById('registration-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const btnSubmit = document.getElementById('btn-submit');
    const originalText = btnSubmit.innerHTML;
    btnSubmit.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Procesando...';
    btnSubmit.disabled = true;

    try {
        // Recopilar Datos
        const dni = document.getElementById('dni').value.trim();
        const nombres = document.getElementById('nombres').value.trim();
        const apellidos = document.getElementById('apellidos').value.trim();
        const correo = document.getElementById('correo').value.trim();
        const telefono = document.getElementById('telefono').value.trim();
        const cicloSelect = document.getElementById('ciclo').value;
        const turnoSelect = document.getElementById('turno').value;

        // Validaciones extra para dominios de correo
        const emailLower = correo.toLowerCase();
        const isAllowedOfficial = emailLower.endsWith('@certus.edu.pe');
        const isCommonPersonal = ['@gmail.com', '@hotmail.com', '@outlook.com', '@yahoo.com', '@icloud.com'].some(d => emailLower.endsWith(d));
        const isEducationalOrGov = emailLower.endsWith('.edu.pe') || emailLower.endsWith('.gob.pe') || emailLower.endsWith('.edu') || emailLower.endsWith('.gob');
        const isGeneralCom = emailLower.endsWith('.com') || emailLower.endsWith('.net') || emailLower.endsWith('.org');

        if (!isAllowedOfficial && !isCommonPersonal && !isEducationalOrGov && !isGeneralCom) {
            throw new Error('Por favor, usa un correo institucional o personal válido (.edu, .gob, .com, etc.)');
        }

        // Preparar Ciclo y Egresado
        let ciclo = cicloSelect;
        let es_egresado = false;
        if (cicloSelect === 'Egresado') {
            ciclo = 'Egresado';
            es_egresado = true;
        }

        const newParticipant = {
            evento_id: targetEventId,
            dni: dni,
            nombres: nombres,
            apellidos: apellidos,
            correo: correo,
            telefono: telefono || null,
            ciclo: ciclo,
            turno: turnoSelect || null,
            es_egresado: es_egresado,
            asistencia: false,
            certificado_autorizado: false
        };

        // Guardar en Supabase (Usamos Upsert por si intenta registrarse de nuevo no cause error, simplemente actualice)
        const { error } = await supabaseClient
            .from('participantes')
            .upsert(newParticipant, { onConflict: 'dni, evento_id' });

        if (error) throw error;

        // Éxito
        Swal.fire({
            title: '¡Inscripción Completada!',
            text: 'Tu registro al evento ha sido exitoso.',
            icon: 'success',
            confirmButtonText: 'Regresar',
            allowOutsideClick: false
        }).then(() => {
            // Recargar para limpiar
            window.location.reload();
        });

    } catch (err) {
        console.error("Error al registrar:", err);
        Swal.fire({
            title: 'Error',
            text: err.message || 'No se pudo guardar la asistencia. Intente nuevamente.',
            icon: 'error',
            confirmButtonText: 'Cerrar'
        });
    } finally {
        btnSubmit.innerHTML = originalText;
        btnSubmit.disabled = false;
    }
});
