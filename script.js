document.addEventListener('DOMContentLoaded', () => {
    // ALERT DEBUG
    // ALERT DEBUG
    // alert('SISTEMA INICIADO: El script se ha cargado correctamente.');

    // Navegación Básica
    const navButtons = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('.content-section');
    const pageTitle = document.getElementById('page-title');

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remover clase active de todos los botones
            navButtons.forEach(b => b.classList.remove('active'));
            // Añadir clase active al botón clickeado
            btn.classList.add('active');

            // Ocultar todas las secciones
            sections.forEach(s => s.classList.remove('active'));

            // Mostrar la sección objetivo
            const targetId = btn.getAttribute('data-target');
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.classList.add('active');
            }

            // Actualizar título de la página
            const title = btn.querySelector('span').textContent;
            pageTitle.textContent = title === 'Inicio' ? 'Panel de Control' : title;
        });
    });

    // Efecto simple en las tarjetas de estadísticas para demostración
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach((card, index) => {
        setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 100 * index);
    });


    // --- EVENT MODAL LOGIC ---
    const modal = document.getElementById('event-modal');
    // Support both buttons if they exist (though old one removed)
    const openModalBtn = document.getElementById('btn-create-event-new');
    const closeModalBtns = document.querySelectorAll('.close-modal');
    const eventForm = document.getElementById('event-form');

    // Open Modal
    if (openModalBtn) {
        openModalBtn.addEventListener('click', () => {
            modal.classList.add('active');
        });
    }

    // Close Modal
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const m = e.target.closest('.modal-overlay');
            if (m) m.classList.remove('active');
        });
    });

    // Close on click outside
    document.querySelectorAll('.modal-overlay').forEach(m => {
        m.addEventListener('click', (e) => {
            if (e.target === m) {
                m.classList.remove('active');
            }
        });
    });

    // --- MODALITY LOGIC ---
    const modalityInputs = document.querySelectorAll('input[name="modality"]');
    const sedesContainer = document.getElementById('sedes-container');

    modalityInputs.forEach(input => {
        input.addEventListener('change', (e) => {
            if (e.target.value === 'Virtual') {
                sedesContainer.classList.add('hidden');
            } else {
                sedesContainer.classList.remove('hidden');
            }
        });
    });

    // --- SCHEDULE LOGIC ---
    const scheduleList = document.getElementById('schedule-list');
    const addScheduleBtn = document.getElementById('add-schedule-btn');

    function createScheduleRow() {
        const row = document.createElement('div');
        row.className = 'schedule-row';
        row.innerHTML = `
            <input type="date" class="input-modern" required>
            <input type="time" class="input-modern" required>
            <span style="color:white">-</span>
            <input type="time" class="input-modern" required>
            <button type="button" class="btn-icon-remove"><i class="ph ph-trash"></i></button>
        `;

        row.querySelector('.btn-icon-remove').addEventListener('click', () => {
            row.remove();
        });

        scheduleList.appendChild(row);
    }

    if (addScheduleBtn) {
        addScheduleBtn.addEventListener('click', createScheduleRow);
    }

    // Add one row by default
    createScheduleRow();

    // --- AUDIENCE SUMMARY LOGIC ---
    const audienceCheckboxes = document.querySelectorAll('.audience-check');
    const summaryText = document.getElementById('audience-summary-text');

    function updateAudienceSummary() {
        const checked = Array.from(audienceCheckboxes).filter(cb => cb.checked);
        const values = checked.map(cb => cb.value);

        const allCycles = ['1', '2', '3', '4', '5', '6+'];
        const selectedCycles = values.filter(v => allCycles.includes(v));
        const hasDocentes = values.includes('Docentes');
        const hasPublico = values.includes('Publico');

        let text = '';

        // Logic 1: Todos los ciclos
        const allCyclesSelected = allCycles.every(c => values.includes(c));

        if (hasDocentes && allCyclesSelected) {
            text = 'Comunidad académica';
        } else if (allCyclesSelected) {
            text = 'Todos los estudiantes';
        } else if (selectedCycles.length > 0) {
            // Logic 2: Ranges
            // Sort cycles to find min/max
            const cycleMap = { '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6+': 6 };
            const sorted = selectedCycles.map(c => cycleMap[c]).sort((a, b) => a - b);

            if (sorted.length === 1) {
                // Single cycle
                // Mapping back numeric to string is tricky if not careful, simpler to just list them
                // But request asked for "quinto a mas" logic etc.
                const mapBack = { 1: '1er', 2: '2do', 3: '3er', 4: '4to', 5: '5to', 6: '6to a más' };
                text = `Estudiantes de ${mapBack[sorted[0]]} ciclo`;
            } else if (sorted.length > 1) {
                const min = sorted[0];
                const max = sorted[sorted.length - 1];

                // Check if it's a contiguous range
                let isContiguous = true;
                for (let i = 0; i < sorted.length - 1; i++) {
                    if (sorted[i + 1] !== sorted[i] + 1) isContiguous = false;
                }

                const mapBack = { 1: '1er', 2: '2do', 3: '3er', 4: '4to', 5: '5to', 6: '6to a más' };

                if (isContiguous) {
                    if (max === 6) {
                        text = `Estudiantes de ${mapBack[min]} a más`;
                    } else {
                        text = `Estudiantes del ${mapBack[min]} al ${mapBack[max]} ciclo`;
                    }
                } else {
                    text = 'Estudiantes (ciclos seleccionados)';
                }
            }

            if (hasDocentes) text += ' y Docentes';
            if (hasPublico) text += ' y Público General';

        } else if (hasDocentes) {
            text = 'Solo Docentes';
        } else if (hasPublico) {
            text = 'Público en General';
        } else {
            text = 'Seleccione audiencia...';
        }

        // Override if mixed logic gets too complex
        if (values.includes('Egresados')) {
            if (text !== 'Seleccione audiencia...') text += ', Egresados';
            else text = 'Egresados';
        }

        summaryText.textContent = text;
    }

    audienceCheckboxes.forEach(cb => {
        cb.addEventListener('change', updateAudienceSummary);
    });

    // --- BACKEND INTEGRATION (SUPABASE) ---
    // Initialize Supabase Client
    const supabaseUrl = 'https://klmjmlhwuzhymrplemgw.supabase.co';
    const supabaseKey = 'sb_publishable_DSS-WHn-WawxfYe0RWUHRg_odMjrb_b';
    const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

    // Function to load events
    async function loadEvents() {
        console.log('Iniciando carga de eventos desde Supabase...');
        const grid = document.getElementById('events-grid');

        try {
            if (grid) grid.innerHTML = '<p style="color:var(--text-muted); text-align:center; padding:2rem;">Conectando con Supabase...<br><span style="font-size:0.8em">Esperando respuesta...</span></p>';

            const { data: rawEvents, error } = await supabase
                .from('eventos')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                throw error;
            }

            // Debug: Mostrar cuantos llegaron
            const count = Array.isArray(rawEvents) ? rawEvents.length : 0;

            if (count === 0) {
                grid.innerHTML = '<p style="color:white; opacity:0.7; text-align:center; padding:2rem;">Conexión exitosa, pero la lista de eventos está vacía.</p>';
                return;
            }

            // Renderizar DIRECTO sin filtrar para ver TODO
            renderEvents(rawEvents);
            renderDashboardCalendar(rawEvents);
            console.log(`Cargados ${count} eventos.`);

        } catch (error) {
            console.error('Error:', error);
            if (grid) grid.innerHTML = `<p style="color:#ef4444; opacity:0.8; text-align:center; padding:2rem;">Error: ${error.message}</p>`;
        }
    }

    // Exponer globalmente y cargar al inicio
    window.loadEvents = loadEvents;
    loadEvents();

    // Function to render events
    function renderEvents(events) {
        const grid = document.getElementById('events-grid');
        grid.innerHTML = ''; // Clear current

        if (events.length === 0) {
            grid.innerHTML = '<p style="color:white; opacity:0.7">No hay eventos registrados.</p>';
            return;
        }

        events.forEach(event => {
            const statusClass = `status-${event.status}`;
            const statusText = getStatusText(event.status);

            // Calc progress based on status (0-7)
            let progress = 0;
            if (event.status >= 0 && event.status <= 7) {
                progress = (event.status / 7) * 100;
            }

            let mainBadge = `<div class="event-status ${statusClass}">${event.status}/7 ${statusText}</div>`;
            let extraStyle = '';
            let metaExtra = '';

            if (event.estado_especial === 'Cancelado') {
                mainBadge = `<div class="event-status" style="background: rgba(248, 113, 113, 0.2); color: #f87171; border-color: rgba(248, 113, 113, 0.3)"><i class="ph ph-x-circle"></i> CANCELADO</div>`;
                extraStyle = 'opacity: 0.7; border: 1px solid rgba(248, 113, 113, 0.3);';
                metaExtra = `<p class="event-meta" style="color:#f87171; margin-top: 5px;"><i class="ph ph-warning-circle"></i> Motivo: ${event.sustento || 'No especificado'}</p>`;
            } else if (event.estado_especial === 'Postergado') {
                mainBadge = `<div class="event-status" style="background: rgba(245, 158, 11, 0.2); color: #f59e0b; border-color: rgba(245, 158, 11, 0.3)"><i class="ph ph-clock"></i> POSTERGADO (${event.status}/7)</div>`;
                metaExtra = `<p class="event-meta" style="color:#f59e0b; margin-top: 5px;"><i class="ph ph-info"></i> Motivo: ${event.sustento || 'No especificado'}</p>`;
            }

            const card = document.createElement('div');
            card.className = 'event-card';
            if (extraStyle) card.style = extraStyle;

            let actionHtml = '';
            if (event.estado_especial !== 'Cancelado') {
                actionHtml = `<button class="btn-icon small" title="Gestionar Estado" onclick="openStatusModal('${encodeURIComponent(JSON.stringify(event))}')"><i class="ph ph-arrows-clockwise"></i></button>`;
            }

            card.innerHTML = `
                ${mainBadge}
                <h3 class="event-title">${event.nombre}</h3>
                <p class="event-meta"><i class="ph ph-calendar-blank"></i> ${event.tipo}</p>
                <p class="event-meta"><i class="ph ph-users"></i> ${event.modalidad}</p>
                ${metaExtra}
                
                <div class="event-progress">
                    <div class="progress-bar" style="width: ${progress}%" ${event.estado_especial === 'Cancelado' ? 'style="background: #f87171"' : event.estado_especial === 'Postergado' ? 'style="background: #f59e0b"' : ''}></div>
                </div>
                
                <div class="event-actions">
                    ${actionHtml}
                    <button class="btn-icon small" title="Editar Evento" onclick="editEvent('${encodeURIComponent(JSON.stringify(event))}')"><i class="ph ph-pencil-simple"></i></button>
                    <button class="btn-icon small" title="Eliminar Evento" onclick="deleteEvent('${event.id}')"><i class="ph ph-trash"></i></button>
                </div>
            `;
            grid.appendChild(card);
        });
    }

    // Function to render Dashboard Calendar
    function renderDashboardCalendar(events) {
        const headerRow = document.getElementById('schedule-header-row');
        const body = document.getElementById('schedule-body');
        if (!headerRow || !body) return;

        // Reset
        headerRow.innerHTML = '<th style="padding: 1rem; border-right: 1px solid var(--border-color); width: 150px; position: sticky; left: 0; background: var(--card-bg); z-index: 2;">Turnos</th>';
        body.innerHTML = '';

        // Extract dates and assignments
        const scheduleMap = new Map(); // Date -> { M: [], T: [], N: [] }
        const turnos = ['M', 'T', 'N'];

        events.forEach(ev => {
            if (ev.estado_especial === 'Cancelado') return; // Skip cancelled events in schedule

            let horarios = [];
            try { horarios = JSON.parse(ev.horario); } catch (e) { }
            if (!Array.isArray(horarios)) return;

            horarios.forEach(h => {
                if (!h.fecha || !h.inicio) return;

                const dateKey = h.fecha;
                if (!scheduleMap.has(dateKey)) {
                    scheduleMap.set(dateKey, { M: [], T: [], N: [] });
                }

                // Determinar turno (M: 00-12, T: 13-17, N: 18-23)
                const horaInicioStr = h.inicio.split(':')[0];
                const horaNumerica = parseInt(horaInicioStr, 10);

                let turnoActual = 'M';
                if (horaNumerica >= 13 && horaNumerica < 18) turnoActual = 'T';
                if (horaNumerica >= 18) turnoActual = 'N';

                scheduleMap.get(dateKey)[turnoActual].push({
                    nombre: ev.nombre,
                    tipo: ev.tipo,
                    inicio: h.inicio,
                    fin: h.fin,
                    status: ev.status,
                    modalidad: ev.modalidad
                });
            });
        });

        // Get sorted unique dates
        const uniqueDates = Array.from(scheduleMap.keys()).sort();

        if (uniqueDates.length === 0) {
            body.innerHTML = '<tr><td colspan="1" style="padding: 2rem; color: var(--text-muted);">No hay horarios registrados.</td></tr>';
            return;
        }

        // Format Date (Spanish)
        const formatOptions = { weekday: 'long', day: 'numeric', month: 'numeric', year: '2-digit' };

        uniqueDates.forEach(dateStr => {
            // dateStr format usually YYYY-MM-DD
            const [y, m, d] = dateStr.split('-');
            const dObj = new Date(y, m - 1, d); // local time without timezone shifts
            let headerText = dObj.toLocaleDateString('es-ES', formatOptions);
            // Capitalize first letter (ex: lunes -> Lunes)
            headerText = headerText.charAt(0).toUpperCase() + headerText.slice(1);

            const th = document.createElement('th');
            th.style.padding = '1rem';
            th.style.borderRight = '1px solid var(--border-color)';
            th.style.minWidth = '200px';
            th.style.fontWeight = '500';
            th.textContent = headerText;
            headerRow.appendChild(th);
        });

        // Build Rows for M, T, N
        const turnoLabels = { 'M': 'Mañana', 'T': 'Tarde', 'N': 'Noche' };
        const turnoColors = { 'M': 'var(--primary-color)', 'T': 'var(--secondary-color)', 'N': 'var(--accent-color)' };

        turnos.forEach(t => {
            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid var(--border-color)';

            // Turno Column (Sticky left)
            const tdTurno = document.createElement('td');
            tdTurno.style.padding = '1rem';
            tdTurno.style.fontWeight = 'bold';
            tdTurno.style.borderRight = '1px solid var(--border-color)';
            tdTurno.style.position = 'sticky';
            tdTurno.style.left = '0';
            tdTurno.style.background = 'var(--bg-color)';
            tdTurno.style.zIndex = '1';
            tdTurno.textContent = turnoLabels[t];
            tr.appendChild(tdTurno);

            uniqueDates.forEach(dateStr => {
                const tdEvents = document.createElement('td');
                tdEvents.style.padding = '0.5rem';
                tdEvents.style.borderRight = '1px solid var(--border-color)';
                tdEvents.style.verticalAlign = 'top';

                const acts = scheduleMap.get(dateStr)[t];

                if (acts.length > 0) {
                    acts.forEach(act => {
                        // Generate color block similar to excel
                        const block = document.createElement('div');
                        let bgColor = 'rgba(255,255,255,0.05)';
                        let borderColor = 'transparent';

                        // Simplistic color mapping based on status or type
                        if (act.status === 7) {
                            bgColor = 'rgba(16, 185, 129, 0.2)'; // Green
                            borderColor = 'rgba(16, 185, 129, 0.4)';
                        } else if (act.status > 0) {
                            bgColor = 'rgba(56, 189, 248, 0.2)'; // Light blue
                            borderColor = 'rgba(56, 189, 248, 0.4)';
                        } else {
                            bgColor = 'rgba(255, 255, 255, 0.05)';
                            borderColor = 'rgba(255,255,255,0.1)';
                        }

                        block.style.background = bgColor;
                        block.style.border = `1px solid ${borderColor}`;
                        block.style.borderRadius = '6px';
                        block.style.padding = '0.5rem';
                        block.style.marginBottom = '0.5rem';
                        block.style.textAlign = 'left';
                        block.style.fontSize = '0.85rem';

                        block.innerHTML = `
                            <strong>${act.tipo}: ${act.nombre}</strong><br>
                            <span style="color:var(--text-muted); font-size: 0.75rem;">${act.modalidad} | ${act.inicio} - ${act.fin}</span>
                        `;
                        tdEvents.appendChild(block);
                    });
                } else {
                    tdEvents.innerHTML = '<span style="color:rgba(255,255,255,0.1); font-size:12px;">-</span>';
                }

                tr.appendChild(tdEvents);
            });

            body.appendChild(tr);
        });
    }

    // --- EVENT CRUD: Edit and Delete ---
    let currentEditEventId = null;

    window.deleteEvent = async function (eventId) {
        if (!confirm('¿ESTÁ COMPLETAMENTE SEGURO de eliminar este evento? Esta acción no se puede deshacer.')) return;

        try {
            const { data, error } = await supabase
                .from('eventos')
                .delete()
                .eq('id', eventId)
                .select(); // Forzar a que devuelva lo eliminado para verificar RLS

            if (error) throw error;

            // Si data está vacío, es probable un bloqueo por reglas de base de datos (RLS)
            if (data && data.length === 0) {
                alert('Aviso: El evento no se pudo eliminar de la base de datos. Verifique que ha deshabilitado el "Row Level Security (RLS)" o ha habilitado políticas de "Delete" en Supabase.');
            } else {
                alert('Evento eliminado correctamente.');
            }
            loadEvents();
        } catch (error) {
            console.error('Error deleting event:', error);
            alert('Error al eliminar el evento: ' + error.message);
        }
    };

    window.editEvent = function (eventDataStr) {
        const eventData = JSON.parse(decodeURIComponent(eventDataStr));
        currentEditEventId = eventData.id;

        // Change modal title and button text
        document.querySelector('#event-modal h2').innerHTML = '<i class="ph ph-pencil"></i> Editar Evento';
        document.querySelector('#event-form button[type="submit"]').textContent = 'Actualizar Evento';

        // Populate fields
        document.getElementById('event-type').value = eventData.tipo;
        document.getElementById('event-name').value = eventData.nombre;

        // Modality
        document.querySelector(`input[name="modality"][value="${eventData.modalidad}"]`).checked = true;
        // Trigger change to hide/show sedes
        document.querySelector(`input[name="modality"][value="${eventData.modalidad}"]`).dispatchEvent(new Event('change'));

        // Sedes
        const sedesArray = eventData.sedes ? eventData.sedes.split(', ') : [];
        document.querySelectorAll('input[name="sede"]').forEach(cb => {
            cb.checked = sedesArray.includes(cb.value);
        });

        // Schedule
        scheduleList.innerHTML = '';
        let horarios = [];
        try {
            horarios = JSON.parse(eventData.horario);
        } catch (e) { }

        if (horarios && horarios.length > 0) {
            horarios.forEach(h => {
                createScheduleRow(h.fecha, h.inicio, h.fin);
            });
        } else {
            createScheduleRow();
        }

        // Audience (complex parsing because it's stored as "Text (VAL1, VAL2)")
        document.querySelectorAll('.audience-check').forEach(cb => cb.checked = false);
        const match = eventData.audiencia ? eventData.audiencia.match(/\((.*?)\)/) : null;
        if (match && match[1]) {
            const checks = match[1].split(',').map(s => s.trim());
            document.querySelectorAll('.audience-check').forEach(cb => {
                if (checks.includes(cb.value)) cb.checked = true;
            });
        }
        updateAudienceSummary();

        // Show modal
        modal.classList.add('active');
    };

    // Modified createScheduleRow to accept initial values
    function createScheduleRow(fecha = '', inicio = '', fin = '') {
        const row = document.createElement('div');
        row.className = 'schedule-row';
        row.innerHTML = `
            <input type="date" class="input-modern" value="${fecha}" required>
            <input type="time" class="input-modern" value="${inicio}" required>
            <span style="color:white">-</span>
            <input type="time" class="input-modern" value="${fin}" required>
            <button type="button" class="btn-icon-remove"><i class="ph ph-trash"></i></button>
        `;

        row.querySelector('.btn-icon-remove').addEventListener('click', () => {
            row.remove();
        });

        scheduleList.appendChild(row);
    }

    // Override old createScheduleRow default if add button is clicked
    if (addScheduleBtn) {
        addScheduleBtn.removeEventListener('click', createScheduleRow);
        addScheduleBtn.addEventListener('click', () => createScheduleRow());
    }

    // --- Create Event Button Reset Logic ---
    if (openModalBtn) {
        openModalBtn.addEventListener('click', () => {
            currentEditEventId = null;
            document.querySelector('#event-modal h2').innerHTML = '<i class="ph ph-calendar-plus"></i> Crear Nuevo Evento';
            document.querySelector('#event-form button[type="submit"]').textContent = 'Guardar Evento';
            eventForm.reset();
            scheduleList.innerHTML = '';
            createScheduleRow();
            updateAudienceSummary();
            modal.classList.add('active');
        });
    }

    function getStatusText(status) {
        const statuses = {
            0: 'En proyecto',
            1: 'Planificado',
            2: 'Formalizado',
            3: 'Comunicado',
            4: 'Difundido',
            5: 'Preparado',
            6: 'Realizado',
            7: 'Concluido'
        };
        return statuses[status] || 'Desconocido';
    }

    // Form Submission (Real)
    eventForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = eventForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Guardando...';
        submitBtn.disabled = true;

        // Gather data
        const formData = new FormData(eventForm);
        const sedes = Array.from(document.querySelectorAll('input[name="sede"]:checked')).map(cb => cb.value).join(', ');
        const audienciaChecks = Array.from(document.querySelectorAll('input[name="audience"]:checked')).map(cb => cb.value).join(', ');

        // Build Schedule JSON
        const scheduleRows = document.querySelectorAll('.schedule-row');
        const schedule = Array.from(scheduleRows).map(row => {
            const inputs = row.querySelectorAll('input');
            return {
                fecha: inputs[0].value,
                inicio: inputs[1].value,
                fin: inputs[2].value
            };
        });

        const data = {
            tipo: document.getElementById('event-type').value,
            nombre: document.getElementById('event-name').value,
            modalidad: document.querySelector('input[name="modality"]:checked').value,
            sedes: sedes,
            horario: JSON.stringify(schedule),
            audiencia: document.getElementById('audience-summary-text').textContent + ' (' + audienciaChecks + ')'
        };

        if (!currentEditEventId) {
            data.status = 0; // Default start status only for new events
        }



        try {
            if (currentEditEventId) {
                // UPDATE EXISTING EVENT
                const { error: updateError } = await supabase
                    .from('eventos')
                    .update(data)
                    .eq('id', currentEditEventId);

                if (updateError) throw updateError;
                alert('Evento actualizado exitosamente.');
                currentEditEventId = null;
            } else {
                // CREATE NEW EVENT
                const { error: insertError } = await supabase
                    .from('eventos')
                    .insert([data]);

                if (insertError) throw insertError;
                alert('Evento guardado exitosamente.');
            }

            modal.classList.remove('active');
            eventForm.reset();
            scheduleList.innerHTML = '';
            createScheduleRow();
            updateAudienceSummary();

            // Recargar lista
            loadEvents();

        } catch (error) {
            console.error('Error:', error);
            alert('Hubo un error al guardar el evento: ' + error.message);
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });

    // --- STATUS WORKFLOW LOGIC ---

    // Definition of the 7-step flow
    const STATUS_FLOW = [
        { id: 0, label: 'En proyecto', req: 'Se inicia el plan de trabajo.' },
        { id: 1, label: 'Planificado', req: 'Se debe crear plan de ejecución / coordinar con ponente / Requerir foto' },
        { id: 2, label: 'Formalizado', req: 'Se debe crear formulario propio para registro, comunicar elaboración material o temario' },
        { id: 3, label: 'Comunicado', req: 'Se debe llenar el formulario de Marca y enviar por correo', actionUrl: 'https://docs.google.com/forms/d/e/1FAIpQLSew6aEIbaWAaYvjXYYY0gxqmAH0g6377nuOEx1Bx5su1j_M_A/viewform', actionLabel: 'Ir al Formulario' },
        { id: 4, label: 'Difundido', req: 'Se debe difundir a través de redes sociales / Whatsapp (Marca también debe hacerlo)' },
        { id: 5, label: 'Preparado', req: 'Se deben terminar los materiales para el evento', redirect: 'comunicacion' },
        { id: 6, label: 'Realizado', req: 'Se debe desarrollar el evento en las fechas programadas' },
        { id: 7, label: 'Concluido', req: 'Se debe entregar constancias y elaborar informe final', redirect: 'generacion' }
    ];

    let currentEventForStatus = null; // Store currently selected event data

    window.openStatusModal = function (eventDataStr) {
        const eventData = JSON.parse(decodeURIComponent(eventDataStr));
        currentEventForStatus = eventData;

        const modal = document.getElementById('status-modal');
        const infoDiv = document.getElementById('status-event-info');
        const currentBadge = document.getElementById('current-status-badge');
        const nextBadge = document.getElementById('next-status-badge');
        const reqList = document.getElementById('req-list');
        const btnAdvance = document.getElementById('btn-advance-status');

        // Populate Info
        infoDiv.innerHTML = `<h3>${eventData.nombre}</h3><p style="color:var(--text-muted)">${eventData.tipo} - ${eventData.modalidad}</p>`;

        // Status Badges
        const currentStep = parseInt(eventData.status) || 0;
        const nextStep = currentStep + 1;

        currentBadge.className = `event-status status-${currentStep}`;
        currentBadge.textContent = `${currentStep}/7 ${getStatusText(currentStep)}`;

        if (nextStep <= 7) {
            nextBadge.className = `event-status status-${nextStep}`;
            nextBadge.textContent = `${nextStep}/7 ${getStatusText(nextStep)}`;
            nextBadge.style.display = 'inline-block';
            btnAdvance.style.display = 'inline-flex';
        } else {
            nextBadge.style.display = 'none'; // Reached end
            btnAdvance.style.display = 'none';
        }

        // Generate Requirements for NEXT step
        reqList.innerHTML = '';
        btnAdvance.disabled = true; // Disabled by default until checks passed

        if (nextStep <= 7) {
            const stepConfig = STATUS_FLOW.find(s => s.id === currentStep); // Requirements to *leave* current or *enter* next? Assuming requirements to complete current -> next.
            // User description says: "1/7 Planificado ... Req foto". "3/7 Comunicado ... se debe ir al enlace".
            // So these are requirements to BE in that stage or to PASS that stage?
            // "cuando este en el paso 3 para completarse se debe ir al enlace" -> Requirements to finish Step 3 (move to 4).

            const configForCurrent = STATUS_FLOW.find(s => s.id === currentStep);

            if (configForCurrent) {
                const li = document.createElement('li');
                li.className = 'req-item';

                // Checkbox logic
                let checkHtml = `<input type="checkbox" class="req-check" id="req-check-main">`;
                let labelHtml = `<label for="req-check-main" class="req-label">${configForCurrent.req}</label>`;
                let actionHtml = '';

                // Specific Logic Step 3 (Form Link)
                if (currentStep === 3) {
                    actionHtml = `<a href="${configForCurrent.actionUrl}" target="_blank" class="req-link-btn">${configForCurrent.actionLabel} <i class="ph ph-arrow-square-out"></i></a>`;
                }

                // Specific Logic Step 5 (Redirect Button - Layout only)
                if (currentStep === 5) {
                    actionHtml = `<button class="req-link-btn" onclick="document.querySelector('[data-target=\\'comunicacion\\']').click(); document.getElementById('status-modal').classList.remove('active');">Ir a Comunicación <i class="ph ph-arrow-right"></i></button>`;
                }
                // Specific Logic Step 7 (Redirect Button)
                if (currentStep === 7) { // Wait, logic says 7 is "Concluido". Transitions only go up to 7. 
                    // Redirects happen when *entering* or *completing*? 
                    // "para el paso 7 que mande a generacion" -> likely when entering 7 or completing 6?
                    // Let's assume on completion of 6 -> 7.
                }

                li.innerHTML = `${checkHtml} <div style="flex:1">${labelHtml}</div> ${actionHtml}`;
                reqList.appendChild(li);

                // Enable button on check
                li.querySelector('.req-check').addEventListener('change', (e) => {
                    btnAdvance.disabled = !e.target.checked;
                });
            }
        }

        modal.classList.add('active');

        // Setup Buttons
        btnAdvance.onclick = () => advanceStatus(eventData, nextStep);

        // --- Cancel and Postpone Logic ---
        const btnShowPostponer = document.getElementById('btn-show-postponer');
        const btnShowCancelar = document.getElementById('btn-show-cancelar');
        const sustentoContainer = document.getElementById('sustento-container');
        const sustentoTitle = document.getElementById('sustento-title');
        const sustentoDesc = document.getElementById('sustento-desc');
        const sustentoText = document.getElementById('sustento-text');
        const btnCancelSpecial = document.getElementById('btn-cancel-special');
        const btnConfirmSpecial = document.getElementById('btn-confirm-special');

        // Reset UI
        sustentoContainer.classList.add('hidden');
        sustentoText.value = '';
        btnShowPostponer.style.display = 'block';
        btnShowCancelar.style.display = 'block';
        sustentoTitle.style.color = 'inherit';

        if (eventData.estado_especial === 'Postergado') {
            btnShowPostponer.style.display = 'none';
            btnAdvance.textContent = "Reanudar Evento";
            btnAdvance.disabled = false;
            btnAdvance.onclick = () => resumeEvent(eventData);
            reqList.innerHTML = '<li style="color:#f59e0b; margin-bottom: 0.5rem;"><i class="ph ph-info"></i> El evento está postergado. Haga clic en Reanudar para continuar.</li>';
        } else {
            btnAdvance.textContent = "Avanzar Estado";
            if (nextStep > 7) btnAdvance.style.display = 'none';
        }

        if (currentStep === 7) {
            btnShowCancelar.style.display = 'none';
            btnShowPostponer.style.display = 'none';
        }

        let pendingSpecialAction = null;

        btnShowPostponer.onclick = () => {
            pendingSpecialAction = 'Postergado';
            sustentoContainer.classList.remove('hidden');
            sustentoTitle.textContent = "Sustento para Postergar";
            sustentoDesc.textContent = "El evento se pausará pero mantendrá su estado actual (Paso " + currentStep + ") para poder ser reanudado en el futuro.";
        };

        btnShowCancelar.onclick = () => {
            pendingSpecialAction = 'Cancelado';
            sustentoContainer.classList.remove('hidden');
            sustentoTitle.textContent = "Sustento para Cancelar";
            sustentoDesc.textContent = "Esto cancelará el evento definitivamente. Esta acción es irreversible.";
            sustentoTitle.style.color = "#f87171";
        };

        btnCancelSpecial.onclick = () => {
            sustentoContainer.classList.add('hidden');
            pendingSpecialAction = null;
        };

        btnConfirmSpecial.onclick = () => {
            const motivo = sustentoText.value.trim();
            if (!motivo) {
                alert("Por favor ingrese el sustento (requerido).");
                return;
            }
            if (pendingSpecialAction === 'Cancelado') {
                if (!confirm("¿ESTÁ COMPLETAMENTE SEGURO de cancelar este evento de forma definitiva? No hay vuelta atrás.")) return;
            }
            executeSpecialAction(eventData.id, pendingSpecialAction, motivo);
        };
    };

    async function executeSpecialAction(eventId, actionName, sustento) {
        try {
            const { error: updateError } = await supabase
                .from('eventos')
                .update({ estado_especial: actionName, sustento: sustento })
                .eq('id', eventId);

            if (updateError) throw updateError;
            alert('Evento marcado como ' + actionName + ' exitosamente.');
            document.getElementById('status-modal').classList.remove('active');
            loadEvents();
        } catch (e) {
            console.error(e);
            alert("Error al actualizar: " + e.message);
        }
    }

    async function resumeEvent(eventData) {
        if (!confirm("¿Desea reanudar este evento postergado?")) return;
        try {
            const { error: updateError } = await supabase
                .from('eventos')
                .update({ estado_especial: null, sustento: null })
                .eq('id', eventData.id);

            if (updateError) throw updateError;
            alert('Evento reanudado exitosamente.');
            document.getElementById('status-modal').classList.remove('active');
            loadEvents();
        } catch (e) {
            console.error(e);
            alert("Error al reanudar: " + e.message);
        }
    }

    async function advanceStatus(eventData, nextStep) {
        if (!confirm(`¿Avanzar evento a: ${getStatusText(nextStep)}?`)) return;

        // Logic for redirects UPON transition
        const flowConfig = STATUS_FLOW.find(s => s.id === nextStep); // Config of the NEW step
        if (flowConfig && flowConfig.redirect) {
            // Redirect happens
            document.querySelector(`[data-target="${flowConfig.redirect}"]`).click();
            document.getElementById('status-modal').classList.remove('active');
        }

        try {
            const { error: updateError } = await supabase
                .from('eventos')
                .update({ status: nextStep })
                .eq('id', eventData.id);

            if (updateError) {
                throw updateError;
            }

            alert(`Estado actualizado a: ${getStatusText(nextStep)}`);
            document.getElementById('status-modal').classList.remove('active');
            loadEvents(); // Reload Events Sync immediately

        } catch (e) {
            alert('Error al actualizar (Ver consola)');
            console.error(e);
        }
    }

    // Modal Close Logic
    const closeStatusModalBtn = document.querySelector('#status-modal .close-modal');
    if (closeStatusModalBtn) {
        closeStatusModalBtn.addEventListener('click', () => {
            document.getElementById('status-modal').classList.remove('active');
        });
    }


    // --- CSV IMPORT LOGIC ---
    const fileInput = document.getElementById('csv-file-input');
    const processBtn = document.getElementById('btn-process-csv');
    const previewContainer = document.getElementById('preview-container');
    const tableBody = document.getElementById('participants-table-body');
    const statsSpan = document.getElementById('import-stats');
    const saveBtn = document.getElementById('btn-save-participants');

    let parsedParticipants = []; // Store data for backend submission

    if (processBtn) {
        processBtn.addEventListener('click', () => {
            console.log('Botón Cargar presionado');
            const file = fileInput.files[0];
            if (!file) {
                alert('Por favor selecciona un archivo CSV primero.');
                return;
            }

            const reader = new FileReader();
            reader.onload = function (e) {
                console.log('Archivo leído');
                const text = e.target.result;
                processCSV(text);
            };
            reader.readAsText(file);
        });
    }

    function processCSV(csvText) {
        console.log('Procesando CSV, longitud:', csvText.length);
        const lines = csvText.split(/\r\n|\n/).filter(line => line.trim() !== '');
        if (lines.length < 2) {
            alert('El archivo parece vacío o no tiene cabeceras (filas insuficientes).');
            return;
        }

        // 1. Detect Headers
        const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase().replace(/"/g, ''));

        // Map headers to internal keys (Based on User Screenshot)
        const map = {
            dni: headers.findIndex(h => h.includes('dni')),
            nombres: headers.findIndex(h => h.includes('nombre') && !h.includes('apellido')), // Avoid "Apellidos y Nombres" if that ever appears
            apellidos: headers.findIndex(h => h.includes('apellido')),
            // Matches "Correo electrónico (Coloca el correo institucional...)"
            correoInst: headers.findIndex(h => h.includes('institucional') || h.includes('correo') && h.includes('electrónico')),
            // Fallback for personal if a separate column exists (not determining from screenshot but keeping logic safe)
            correoPers: headers.findIndex(h => h.includes('personal') && h.includes('correo')),
            // Matches "Número de celular activo...", "Celular", "Teléfono", "Móvil", etc.
            telefono: headers.findIndex(h => h.includes('celular') || h.includes('teléfono') || h.includes('telefono') || h.includes('whatsapp') || h.includes('cel') || h.includes('movil') || h.includes('phone'))
        };

        // --- HEURISTIC DETECTION FOR PHONE ---
        // If phone column not found by name, scan data for 9-digit patterns
        if (map.telefono === -1 && lines.length > 1) {
            console.log('Teléfono no detectado por cabecera. Iniciando escaneo heurístico...');
            const maxRowsToScan = Math.min(lines.length - 1, 20);
            const columnScores = {};

            for (let i = 1; i <= maxRowsToScan; i++) {
                const row = parseCSVLine(lines[i]);
                row.forEach((cell, index) => {
                    // Check if looks like a phone number (9 digits, maybe spaces)
                    const clean = cell.replace(/\D/g, '');
                    if (clean.length === 9 && cell.length < 20) { // Limit length to avoid long numeric strings
                        columnScores[index] = (columnScores[index] || 0) + 1;
                    }
                });
            }

            // Find column with max checks
            let bestCol = -1;
            let maxScore = 0;
            for (const [colIndex, score] of Object.entries(columnScores)) {
                if (score > maxScore) {
                    maxScore = score;
                    bestCol = parseInt(colIndex);
                }
            }

            // Threshold: at least 1 match? or more depending on scan size?
            // If we found a column with good signal, use it.
            if (bestCol !== -1) {
                console.log(` heurística: Columna ${bestCol} parece ser teléfono (Score: ${maxScore})`);
                map.telefono = bestCol;
            }
        }

        parsedParticipants = [];
        tableBody.innerHTML = '';

        let validCount = 0;
        let warningCount = 0;

        // 2. Parse Rows
        for (let i = 1; i < lines.length; i++) {
            const row = parseCSVLine(lines[i]);

            if (!row || row.length < headers.length * 0.5) continue; // Skip empty/malformed

            // Extract values
            let dni = map.dni !== -1 ? (row[map.dni] || '') : '';
            let nombres = map.nombres !== -1 ? (row[map.nombres] || '') : '';
            let apellidos = map.apellidos !== -1 ? (row[map.apellidos] || '') : '';

            // Combine names if split, or use full name if combined
            let fullName = apellidos ? `${apellidos}, ${nombres}` : nombres;

            let emailInst = map.correoInst !== -1 ? (row[map.correoInst] || '') : '';
            let emailPers = map.correoPers !== -1 ? (row[map.correoPers] || '') : '';

            // Clean Phone: Remove spaces and non-digits
            let telefono = map.telefono !== -1 ? (row[map.telefono] || '') : '';
            telefono = telefono.replace(/\s+/g, '').replace(/\D/g, ''); // Keep only digits

            // Priority Logic
            let finalEmail = emailInst && isValidEmail(emailInst) ? emailInst : emailPers;

            // Validation
            let status = 'ok';
            let msg = '';

            // DNI Validation
            dni = dni.replace(/\D/g, ''); // Remove non-digits
            if (dni.length !== 8) {
                status = 'error';
                msg += 'DNI debe tener 8 dígitos. ';
            }

            // Phone Validation
            if (telefono.length > 0 && telefono.length !== 9) {
                status = 'warning'; // Warning, not blocking error? Or error? Let's say warning for phone.
                msg += 'Celular debe tener 9 dígitos. ';
            }

            // Email Validation
            if (!isValidEmail(finalEmail)) {
                status = 'error';
                msg += 'Correo inválido o dominio no permitido (@certus.edu.pe / @gmail.com). ';
                finalEmail = finalEmail || (emailInst + ' ' + emailPers);
            } else if (emailInst && !isValidEmail(emailInst) && isValidEmail(emailPers)) {
                status = 'warning';
                msg += 'Usando correo personal (Inst. no válido). ';
            }

            // Create Object
            const participant = {
                id: i, // temp id
                dni: dni,
                nombresRaw: nombres.replace(/"/g, '').trim(),
                apellidosRaw: apellidos.replace(/"/g, '').trim(),
                nombre: fullName.replace(/"/g, ''),
                email: finalEmail.replace(/"/g, ''),
                telefono: telefono,
                status: status,
                msg: msg
            };

            parsedParticipants.push(participant);
            renderRow(participant);

            if (status === 'ok') validCount++;
            else warningCount++;
        }

        previewContainer.classList.remove('hidden');
        statsSpan.innerHTML = `Detectados: <b>${parsedParticipants.length}</b> | Válidos: <b style="color:#4ade80">${validCount}</b> | Observados: <b style="color:#f87171">${warningCount}</b>`;

        const exportBtn = document.getElementById('btn-export-contacts');
        if (exportBtn) exportBtn.disabled = false;
    }

    function parseCSVLine(text) {
        // Handle quotes
        const result = [];
        let start = 0;
        let inQuotes = false;
        for (let i = 0; i < text.length; i++) {
            if (text[i] === '"') {
                inQuotes = !inQuotes;
            } else if (text[i] === ',' && !inQuotes) {
                result.push(text.substring(start, i));
                start = i + 1;
            }
        }
        result.push(text.substring(start));
        return result.map(s => s.replace(/^"|"$/g, '').trim());
    }

    function isValidEmail(email) {
        if (!email) return false;
        // Check standard format AND specific domains
        const regex = /^[^\s@]+@(gmail\.com|certus\.edu\.pe)$/i;
        return regex.test(email.trim());
    }

    function renderRow(p) {
        const tr = document.createElement('tr');
        const badgeClass = p.status === 'ok' ? 'ok' : 'error';
        const badgeText = p.status === 'ok' ? 'OK' : 'OBSERVADO';

        tr.innerHTML = `
            <td><span class="status-badge ${badgeClass}" title="${p.msg}">${badgeText}</span></td>
            <td><input type="text" class="table-input ${p.status === 'error' && p.dni.length !== 8 ? 'invalid' : ''}" value="${p.dni}" onchange="updateParticipant(${p.id}, 'dni', this.value)"></td>
            <td><input type="text" class="table-input" value="${p.nombre}" onchange="updateParticipant(${p.id}, 'nombre', this.value)"></td>
            <td><input type="email" class="table-input ${!isValidEmail(p.email) ? 'invalid' : ''}" value="${p.email}" onchange="updateParticipant(${p.id}, 'email', this.value)"></td>
            <td><input type="text" class="table-input" value="${p.telefono}" onchange="updateParticipant(${p.id}, 'telefono', this.value)"></td>
            <td>
                <button class="btn-icon small" onclick="removeParticipant(${p.id}, this)"><i class="ph ph-trash"></i></button>
            </td>
        `;
        tableBody.appendChild(tr);
    }

    // Expose update function carefully or attach listeners
    window.updateParticipant = function (id, field, value) {
        const p = parsedParticipants.find(x => x.id === id);
        if (p) {
            p[field] = value;
            // Re-validate simple rules
            if (field === 'dni') {
                // Check length
            }
            // In a real app we would re-render badge. For now, trust user edits clearly invalid fields.
        }
    };

    window.removeParticipant = function (id, btn) {
        parsedParticipants = parsedParticipants.filter(x => x.id !== id);
        btn.closest('tr').remove();
        // Update stats?
    };

    const exportBtn = document.getElementById('btn-export-contacts');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            const labelInput = document.getElementById('contact-label');
            const label = labelInput ? labelInput.value.trim() : 'Importado';
            downloadGoogleCSV(parsedParticipants, label);
        });
    }

    function downloadGoogleCSV(data, labelKey) {
        if (data.length === 0) {
            alert('No hay datos para exportar.');
            return;
        }

        // Google Contacts CSV Headers (User Specified Format)
        const csvHeaders = [
            'First Name', 'Middle Name', 'Last Name', 'Phonetic First Name',
            'Phonetic Middle Name', 'Phonetic Last Name', 'Name Prefix', 'Name Suffix',
            'Nickname', 'File As', 'Organization Name', 'Organization Title',
            'Organization Department', 'Birthday', 'Notes', 'Photo', 'Labels', 'Phone 1 - Label',
            'Phone 1 - Value'
        ];

        const csvRows = [csvHeaders.join(',')];

        data.filter(p => p.status === 'ok').forEach(p => {
            const escape = (val) => {
                if (!val) return '';
                val = String(val).replace(/"/g, '""');
                if (val.includes(',') || val.includes('\n')) return `"${val}"`;
                return val;
            };

            // Phone formatting: Ensure +51
            let phoneVal = p.telefono || '';
            phoneVal = phoneVal.replace(/\s+/g, '');
            if (phoneVal.length === 9 && !phoneVal.startsWith('+')) {
                phoneVal = '+51' + phoneVal;
            }

            // Name Logic: Label_FirstName
            const cleanLabel = (labelKey && labelKey !== 'Importado') ? labelKey.trim() : '';

            // First Name Prefix
            const firstNameRaw = p.nombresRaw || p.nombre;
            const finalFirstName = cleanLabel ? `${cleanLabel}_${firstNameRaw}` : firstNameRaw;

            // Label Logic: * myContacts (FIXED)
            const finalLabelColumn = '* myContacts';

            const row = [
                escape(finalFirstName), // 1. First Name
                '', // 2. Middle Name
                escape(p.apellidosRaw || ''), // 3. Last Name
                '', '', '', '', '', '', '', '', '', '', '', '', '', // 4-16
                escape(finalLabelColumn), // 17. Labels
                'Mobile', // 18 Phone 1 - Label
                escape(phoneVal) // 19 Phone 1 - Value
            ];

            csvRows.push(row.join(','));
        });

        if (csvRows.length < 2) {
            alert('No hay participantes válidos (Status OK) para exportar.');
            return;
        }

        const csvString = '\uFEFF' + csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `contactos_google_${new Date().toISOString().slice(0, 10)}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }



    // --- MANUAL EMAIL GENERATION LOGIC ---
    const btnGenerateManual = document.getElementById('btn-generate-manual');
    const fieldEmails = document.getElementById('manual-emails');
    const fieldSubject = document.getElementById('manual-subject');
    const fieldBody = document.getElementById('manual-body');
    const mailtoLink = document.getElementById('mailto-link');

    if (btnGenerateManual) {
        btnGenerateManual.addEventListener('click', () => {
            // 1. Get Recipients
            const validRecipients = parsedParticipants.filter(p => p.status === 'ok');
            if (validRecipients.length === 0) {
                alert('No hay destinatarios válidos cargados (Status OK).');
                return;
            }

            // 2. Get Template
            const subjectInput = document.querySelector('.template-form input');
            const bodyInput = document.querySelector('.template-form textarea');

            const subject = subjectInput ? subjectInput.value : '';
            const body = bodyInput ? bodyInput.value : '';

            if (!subject || !body) {
                alert('Por favor define el Asunto y Mensaje en la pestaña "Comunicación".');
                return;
            }

            // 3. Generate Lists
            const emailList = validRecipients.map(p => p.email).join(', ');

            // 4. Populate Fields
            fieldEmails.value = emailList;
            fieldSubject.value = subject;

            // Check for personalization tags in body
            if (body.includes('{nombre}') || body.includes('{dni}')) {
                alert('ADVERTENCIA: Tu mensaje usa variables como {nombre}. En el modo manual (copiar y pegar), NO se pueden personalizar los mensajes individuales. Se usará una versión genérica.');
            }

            // Generic Body Cleaning
            let cleanBody = body
                .replace(/{nombre}/g, 'Estimado(a) Estudiante')
                .replace(/{dni}/g, '[DNI]')
                .replace(/{curso}/g, 'Evento Académico')
                .replace(/{fecha}/g, new Date().toLocaleDateString());

            fieldBody.value = cleanBody;

            // 5. Generate Mailto (Optional helper, might be too long for browsers)
            // Limit to first 50 chars of body to avoid URL limits if needed, or try full.
            // Mailto often fails with too many recipients (approx 2000 chars limit).
            // We will try to put limits.
            const mailtoUrl = `mailto:?bcc=${emailList}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(cleanBody)}`;
            if (mailtoUrl.length < 2000) {
                mailtoLink.href = mailtoUrl;
                mailtoLink.classList.remove('hidden');
            } else {
                mailtoLink.classList.add('hidden'); // Too long
            }

            alert('Datos generados. Puedes copiarlos ahora.');
        });
    }

    // Helper to copy
    window.copyToClipboard = function (elementId) {
        const el = document.getElementById(elementId);
        if (el) {
            el.select();
            el.setSelectionRange(0, 99999); // Mobile
            navigator.clipboard.writeText(el.value).then(() => {
                // Visual feedback?
                const originalBtn = el.nextElementSibling.innerHTML;
                el.nextElementSibling.innerHTML = '<i class="ph ph-check"></i>';
                setTimeout(() => el.nextElementSibling.innerHTML = originalBtn, 1500);
            });
        }
    };

});

// Close Modal on Outside Click
window.addEventListener('click', (e) => {
    const modal = document.getElementById('status-modal');
    if (e.target === modal) {
        modal.classList.remove('active');
    }
});

