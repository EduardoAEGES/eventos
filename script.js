document.addEventListener('DOMContentLoaded', () => {
    // 🔗 URL DEL WEBHOOK DE APPS SCRIPT PARA SINCRONIZAR A SHEETS
    // Pega aquí la URL que te da Google al "Implementar como Aplicación Web"
    const GOOGLE_APP_SCRIPT_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbzcuWg_eQmRMYfcilsm4b4TxlBw8YrP5p6U-UuewY6zQv7zS8ow2DZjO-ek2hYuvk4/exec";

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

    // Close on click outside (only if it's not the event creation modal)
    document.querySelectorAll('.modal-overlay').forEach(m => {
        m.addEventListener('click', (e) => {
            if (e.target === m && m.id !== 'event-modal') {
                m.classList.remove('active');
            }
        });
    });

    // --- MODALITY LOGIC ---
    const modalityInputs = document.querySelectorAll('input[name="modality"]');
    const sedesContainer = document.getElementById('sedes-container');

    // Mantenemos el contenedor de sede visible siempre a petición del usuario
    if (sedesContainer) {
        sedesContainer.classList.remove('hidden');
    }

    modalityInputs.forEach(input => {
        input.addEventListener('change', (e) => {
            // Ya no ocultamos nada
            if (sedesContainer) {
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
                const mapBack = { 1: '1er', 2: '2do', 3: '3er', 4: '4to', 5: '5to', 6: '6to a más' };
                text = `Estudiantes de ${mapBack[sorted[0]]} ciclo`;
            } else if (sorted.length > 1) {
                const min = sorted[0];
                const max = sorted[sorted.length - 1];

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
                    const cycleNames = sorted.map(c => mapBack[c]);
                    if (cycleNames.length === 2) {
                        text = `Estudiantes del ${cycleNames[0]} y ${cycleNames[1]} ciclo`;
                    } else {
                        const last = cycleNames.pop();
                        text = `Estudiantes del ${cycleNames.join(', ')} y ${last} ciclo`;
                    }
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

        if (values.includes('Egresados')) {
            if (text !== 'Seleccione audiencia...') text += ', Egresados';
            else text = 'Egresados';
        }

        // Agregar detalle opcional si existe
        const detailInput = document.getElementById('audience-detail-input');
        if (detailInput && detailInput.value.trim() !== '') {
            if (text !== 'Seleccione audiencia...') {
                text += ' (' + detailInput.value.trim() + ')';
            } else {
                text = detailInput.value.trim();
            }
        }

        summaryText.textContent = text;
    }

    audienceCheckboxes.forEach(cb => {
        cb.addEventListener('change', updateAudienceSummary);
    });

    // Eventos para el detalle opcional de audiencia
    const btnToggleAudienceDetail = document.getElementById('btn-toggle-audience-detail');
    const audienceDetailInput = document.getElementById('audience-detail-input');

    if (btnToggleAudienceDetail && audienceDetailInput) {
        btnToggleAudienceDetail.addEventListener('click', () => {
            if (audienceDetailInput.style.display === 'none') {
                audienceDetailInput.style.display = 'block';
                audienceDetailInput.focus();
                btnToggleAudienceDetail.innerHTML = '<i class="ph ph-minus"></i> Ocultar detalle';
            } else {
                audienceDetailInput.style.display = 'none';
                audienceDetailInput.value = '';
                btnToggleAudienceDetail.innerHTML = '<i class="ph ph-plus"></i> Añadir detalle específico (Opcional)';
                updateAudienceSummary();
            }
        });

        audienceDetailInput.addEventListener('input', updateAudienceSummary);
    }


    // --- BACKEND INTEGRATION (SUPABASE) ---
    // Initialize Supabase Client
    const supabaseUrl = 'https://klmjmlhwuzhymrplemgw.supabase.co';
    const supabaseKey = 'sb_publishable_DSS-WHn-WawxfYe0RWUHRg_odMjrb_b';
    const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

    let allEventsData = [];

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

            // Guardar datos y aplicar filtros para listas
            allEventsData = rawEvents;
            applyFilters();

            // El calendario del dashboard en general sí muestra todo (excepto cancelados), o como prefieras
            renderDashboardCalendar(rawEvents);
            console.log(`Cargados ${count} eventos.`);

        } catch (error) {
            console.error('Error:', error);
            if (grid) grid.innerHTML = `<p style="color:#ef4444; opacity:0.8; text-align:center; padding:2rem;">Error: ${error.message}</p>`;
        }
    }

    // Function to load ponentes para el Select
    async function loadPonentes() {
        try {
            const { data: ponentes, error } = await supabase
                .from('ponentes')
                .select('*')
                .order('apellidos', { ascending: true });

            if (error) throw error;

            const selectPonente = document.getElementById('event-ponente');
            if (!selectPonente) return;

            // Guardar valor actual para restaurar si es posible
            const currentVal = selectPonente.value;

            // Limpiar y dejar Pendiente y Agregar
            selectPonente.innerHTML = `
                <option value="Pendiente">Pendiente</option>
                <option value="new_ponente" style="font-weight:bold; color:var(--primary-color);">+ Agregar nuevo ponente...</option>
            `;

            let foundCurrent = false;

            // Insertar opciones antes del botón de Agregar (es el último)
            ponentes.forEach(p => {
                if (p.nombres === 'Pendiente') return; // Saltar el default que ya pusimos duro arriba

                const option = document.createElement('option');
                const fullName = `${p.apellidos ? p.apellidos + ',' : ''} ${p.nombres}`.trim();
                const textVal = fullName;
                option.value = textVal;
                option.textContent = textVal + (p.tipo_docente === 'Docente CERTUS' ? ' (CERTUS)' : '');

                if (textVal === currentVal) foundCurrent = true;

                // Insertar justo antes del último
                selectPonente.insertBefore(option, selectPonente.lastElementChild);
            });

            if (foundCurrent) selectPonente.value = currentVal;
            if (typeof toggleDeletePonenteBtn === 'function') toggleDeletePonenteBtn();

        } catch (e) {
            console.error("Error cargando ponentes:", e);
        }
    }

    // Lógica para agregar y Eliminar Ponente
    const selectPonente = document.getElementById('event-ponente');
    const btnDeletePonente = document.getElementById('btn-delete-ponente');
    const newPonenteModal = document.getElementById('new-ponente-modal');
    const newPonenteForm = document.getElementById('new-ponente-form');
    let previousPonenteValue = 'Pendiente';

    function toggleDeletePonenteBtn() {
        if (!selectPonente || !btnDeletePonente) return;
        const val = selectPonente.value;
        if (val === 'Pendiente' || val === 'new_ponente' || !val) {
            btnDeletePonente.style.display = 'none';
        } else {
            btnDeletePonente.style.display = 'block';
        }
    }

    if (selectPonente) {
        selectPonente.addEventListener('change', (e) => {
            if (e.target.value === 'new_ponente') {
                newPonenteModal.classList.add('active');
                if (newPonenteForm) newPonenteForm.reset();
            } else {
                previousPonenteValue = e.target.value;
            }
            toggleDeletePonenteBtn();
            if (typeof updateAutoDescription === 'function') updateAutoDescription();
        });
    }

    if (btnDeletePonente) {
        btnDeletePonente.addEventListener('click', async () => {
            const ponenteName = selectPonente.value;
            if (!ponenteName || ponenteName === 'Pendiente' || ponenteName === 'new_ponente') return;

            const result = await Swal.fire({
                title: '¿Eliminar Ponente?',
                text: `¿Está seguro de eliminar al ponente "${ponenteName}"? Esta acción no se puede deshacer.`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#f87171',
                cancelButtonColor: '#6b7280',
                confirmButtonText: 'Sí, eliminar',
                cancelButtonText: 'Cancelar'
            });

            if (result.isConfirmed) {
                try {
                    const { data: ponentes, error: fetchErr } = await supabase.from('ponentes').select('*');
                    if (fetchErr) throw fetchErr;

                    let targetId = null;
                    for (let p of ponentes) {
                        const fullName = `${p.apellidos ? p.apellidos + ',' : ''} ${p.nombres}`.trim();
                        if (fullName === ponenteName) {
                            targetId = p.id;
                            break;
                        }
                    }

                    if (targetId) {
                        const { error: delErr } = await supabase.from('ponentes').delete().eq('id', targetId);
                        if (delErr) throw delErr;
                        Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Ponente eliminado', showConfirmButton: false, timer: 2000 });
                        selectPonente.value = 'Pendiente';
                        await loadPonentes();
                        if (typeof updateAutoDescription === 'function') updateAutoDescription();
                    } else {
                        Swal.fire('Error', 'No se encontró el ponente exacto en la base de datos.', 'error');
                    }
                } catch (err) {
                    console.error("Error eliminando ponente:", err);
                    Swal.fire('Error', 'No se pudo eliminar el ponente.', 'error');
                }
            }
        });
    }

    // Botones del Modal Ponente
    const closeNewPonenteBtn = document.getElementById('close-new-ponente');
    const cancelNewPonenteBtn = document.getElementById('btn-cancel-ponente');

    const closePonenteModal = () => {
        newPonenteModal.classList.remove('active');
        selectPonente.value = previousPonenteValue; // Restaurar selección
        toggleDeletePonenteBtn();
    };

    if (closeNewPonenteBtn) closeNewPonenteBtn.addEventListener('click', closePonenteModal);
    if (cancelNewPonenteBtn) cancelNewPonenteBtn.addEventListener('click', closePonenteModal);

    if (newPonenteForm) {
        newPonenteForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('btn-save-ponente');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Guardando...';
            btn.disabled = true;

            const nombres = document.getElementById('ponente-nombres').value.trim();
            const apellidos = document.getElementById('ponente-apellidos').value.trim();
            const tipo = document.getElementById('ponente-tipo').value;
            const especialidad = document.getElementById('ponente-especialidad').value.trim();

            try {
                const { error: insertError } = await supabase
                    .from('ponentes')
                    .insert([{ nombres, apellidos, tipo_docente: tipo, especialidad }]);

                if (insertError) throw insertError;

                Swal.fire({
                    toast: true, position: 'top-end', icon: 'success', title: 'Ponente guardado',
                    showConfirmButton: false, timer: 2000
                });

                await loadPonentes(); // Recargar opciones

                newPonenteModal.classList.remove('active');
                const newNameCombo = `${apellidos ? apellidos + ',' : ''} ${nombres}`.trim();
                previousPonenteValue = newNameCombo;

                // Intentar seleccionar el recien creado (asegurarse de que existan los valores)
                setTimeout(() => {
                    selectPonente.value = newNameCombo;
                    toggleDeletePonenteBtn();
                    if (typeof updateAutoDescription === 'function') updateAutoDescription();
                }, 100);

            } catch (err) {
                console.error("Error guardando ponente:", err);
                Swal.fire('Error', 'No se pudo guardar el ponente', 'error');
            } finally {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        });
    }

    // --- LÓGICA DE DESCRIPCIÓN AUTOMÁTICA GENERADA NATIVAMENTE ---
    const btnAutoDesc = document.getElementById('btn-auto-desc');
    const eventDescInput = document.getElementById('event-descripcion');

    if (btnAutoDesc && eventDescInput) {
        btnAutoDesc.addEventListener('click', () => {
            const eventTypeSelect = document.getElementById('event-type');
            const eventNameInput = document.getElementById('event-name');
            const selectPonente = document.getElementById('event-ponente');

            const tipo = eventTypeSelect ? eventTypeSelect.value : '';
            const nombre = eventNameInput ? eventNameInput.value.trim() : '';
            const ponente = selectPonente ? selectPonente.value : '';

            const audienciaChecks = Array.from(document.querySelectorAll('input[name="audience"]:checked')).map(cb => cb.value).join(', ');
            const textAud = document.getElementById('audience-detail-input') ? document.getElementById('audience-detail-input').value.trim() : '';
            let audiencia = (audienciaChecks && textAud) ? `${audienciaChecks} (${textAud})` : (textAud || audienciaChecks);

            // Sedes & Modalidad
            const modChecked = document.querySelector('input[name="modality"]:checked');
            const modalidad = modChecked ? modChecked.value : 'No establecido';

            const sedesArr = Array.from(document.querySelectorAll('input[name="sede"]:checked')).map(cb => cb.value);
            let sedeStr = sedesArr.length > 0 ? sedesArr.join(', ') : 'No establecido';

            if (!tipo || !nombre) {
                Swal.fire({ toast: true, position: 'top-end', icon: 'warning', title: 'Complete Tipo y Nombre primero', showConfirmButton: false, timer: 3000 });
                return;
            }

            const ponenteClean = (ponente && ponente !== 'Pendiente' && ponente !== 'new_ponente') ? ponente.replace(' (CERTUS)', '') : 'Docente por Asignar';
            const audClean = audiencia ? audiencia : 'Público en general';
            const temaTitle = nombre.toLowerCase().replace(tipo.toLowerCase(), '').trim() || nombre;

            const finalDesc = `${tipo} a cargo del ponente ${ponenteClean}, dirigido a ${audClean}. En este espacio se desarrollará el tema: ${temaTitle}. Modalidad: ${modalidad}. Sede: ${sedeStr}.`;
            eventDescInput.value = finalDesc;

            // Disparar evento input para autoguardar
            eventDescInput.dispatchEvent(new Event('input'));

            Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Descripción generada', showConfirmButton: false, timer: 2000 });
        });
    }

    // Exponer globalmente y cargar al inicio
    window.loadEvents = loadEvents;
    loadEvents();
    loadPonentes();

    function applyFilters() {
        const searchInput = document.getElementById('search-filter');
        const statusSelect = document.getElementById('status-filter');
        const monthSelect = document.getElementById('month-filter');
        const visibilitySelect = document.getElementById('visibility-filter');

        const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
        const statusVal = statusSelect ? statusSelect.value : 'all';
        const monthVal = monthSelect ? monthSelect.value : 'all';
        const visibilityVal = visibilitySelect ? visibilitySelect.value : 'all';

        const filtered = allEventsData.filter(ev => {
            const matchesSearch = ev.nombre.toLowerCase().includes(searchTerm) ||
                ev.tipo.toLowerCase().includes(searchTerm) ||
                ev.modalidad.toLowerCase().includes(searchTerm) ||
                (ev.ponente && ev.ponente.toLowerCase().includes(searchTerm));
            if (!matchesSearch) return false;

            if (statusVal !== 'all') {
                if (statusVal === 'Cancelado' || statusVal === 'Postergado') {
                    if (ev.estado_especial !== statusVal) return false;
                } else {
                    if (ev.estado_especial === 'Cancelado' || ev.estado_especial === 'Postergado') return false;
                    if (ev.status.toString() !== statusVal) return false;
                }
            }

            // Month filter
            if (monthVal !== 'all') {
                let eventMonth = -1;
                try {
                    const horarios = JSON.parse(ev.horario || '[]');
                    if (horarios.length > 0 && horarios[0].fecha) {
                        const parts = horarios[0].fecha.split('-');
                        if (parts.length === 3) {
                            eventMonth = parseInt(parts[1], 10);
                        }
                    }
                } catch (e) { }
                if (eventMonth.toString() !== monthVal) return false;
            }

            // Visibility filter
            if (visibilityVal !== 'all') {
                const isPub = !!ev.is_public;
                if (visibilityVal === 'publico' && !isPub) return false;
                if (visibilityVal === 'privado' && isPub) return false;
            }

            return true;
        });

        renderEvents(filtered);
    }

    const searchInputEl = document.getElementById('search-filter');
    const statusSelectEl = document.getElementById('status-filter');
    const monthSelectEl = document.getElementById('month-filter');
    const visibilitySelectEl = document.getElementById('visibility-filter');

    if (searchInputEl) searchInputEl.addEventListener('input', applyFilters);
    if (statusSelectEl) statusSelectEl.addEventListener('change', applyFilters);
    if (monthSelectEl) monthSelectEl.addEventListener('change', applyFilters);
    if (visibilitySelectEl) visibilitySelectEl.addEventListener('change', applyFilters);

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

    // Global variable to keep track of current dashboard month
    let currentDashboardDate = new Date(); // Start at current month

    function renderDashboardCalendar(events) {
        const grid = document.getElementById('monthly-calendar-grid');
        const monthLabel = document.getElementById('current-month-label');
        if (!grid || !monthLabel) return;

        // Apply Calendar Filters
        const calendarVisFilter = document.getElementById('calendar-visibility-filter');
        const calendarSedeFilter = document.getElementById('calendar-sede-filter');
        const visFilterVal = calendarVisFilter ? calendarVisFilter.value : 'all';
        const sedeFilterVal = calendarSedeFilter ? calendarSedeFilter.value : 'all';

        const filteredEvents = events.filter(ev => {
            if (visFilterVal !== 'all') {
                const isPub = !!ev.is_public;
                if (visFilterVal === 'publico' && !isPub) return false;
                if (visFilterVal === 'privado' && isPub) return false;
            }
            if (sedeFilterVal !== 'all') {
                if (!ev.sedes || (!ev.sedes.includes(sedeFilterVal) && !ev.sedes.includes('Todas'))) return false;
            }
            return true;
        });

        // Add filter listeners if not present
        if (calendarVisFilter && !calendarVisFilter.hasAttribute('data-listener')) {
            calendarVisFilter.addEventListener('change', () => renderDashboardCalendar(events));
            calendarVisFilter.setAttribute('data-listener', 'true');
        }
        if (calendarSedeFilter && !calendarSedeFilter.hasAttribute('data-listener')) {
            calendarSedeFilter.addEventListener('change', () => renderDashboardCalendar(events));
            calendarSedeFilter.setAttribute('data-listener', 'true');
        }

        // Configuration
        const year = currentDashboardDate.getFullYear();
        const month = currentDashboardDate.getMonth();

        // Update label
        const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
        monthLabel.textContent = `${monthNames[month]} ${year}`;

        grid.innerHTML = '';

        // Generate Days of Week Header
        const daysOfWeek = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
        daysOfWeek.forEach(day => {
            const dayEl = document.createElement('div');
            dayEl.style.background = '#0f172a';
            dayEl.style.color = '#cbd5e1';
            dayEl.style.padding = '10px 5px';
            dayEl.style.textAlign = 'center';
            dayEl.style.fontWeight = 'bold';
            dayEl.style.fontSize = '0.85rem';
            dayEl.style.textTransform = 'uppercase';
            grid.appendChild(dayEl);
            dayEl.textContent = day;
        });

        // Generate Grid Cells
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // JS getDay() -> Sunday is 0. We want Monday to be 0 for our grid.
        let startOffset = firstDayOfMonth - 1;
        if (startOffset < 0) startOffset = 6; // Sunday becomes 6

        // Previous month days to fill the gap
        const daysInPrevMonth = new Date(year, month, 0).getDate();
        for (let i = 0; i < startOffset; i++) {
            const cell = createCalendarCell(daysInPrevMonth - startOffset + i + 1, true);
            grid.appendChild(cell);
        }

        // Current month cells
        const cellsMap = new Map(); // Para mapear dateStr -> bloque de eventos HTML
        for (let day = 1; day <= daysInMonth; day++) {
            const cell = createCalendarCell(day, false);

            // Generate full date string for mapping
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

            const eventsContainer = document.createElement('div');
            eventsContainer.style.display = 'flex';
            eventsContainer.style.flexDirection = 'column';
            eventsContainer.style.gap = '4px';
            eventsContainer.style.marginTop = '8px';

            cell.appendChild(eventsContainer);
            cellsMap.set(dateStr, eventsContainer);
            grid.appendChild(cell);
        }

        // Next month days to fill the row (total 42 cells is common for 6 rows)
        const totalCells = startOffset + daysInMonth;
        const remainder = totalCells % 7;
        if (remainder !== 0) {
            for (let i = 1; i <= 7 - remainder; i++) {
                const cell = createCalendarCell(i, true);
                grid.appendChild(cell);
            }
        }

        // Sort events chronologically to render them properly
        const flatEvents = [];
        filteredEvents.forEach(ev => {
            if (ev.estado_especial === 'Cancelado') return;
            let horarios = [];
            try { horarios = JSON.parse(ev.horario); } catch (e) { }
            if (Array.isArray(horarios)) {
                horarios.forEach(h => {
                    if (h.fecha && h.inicio) {
                        flatEvents.push({ raw: ev, h: h });
                    }
                });
            }
        });

        // Ordenar por hora de inicio
        flatEvents.sort((a, b) => a.h.inicio.localeCompare(b.h.inicio));

        // Filter events for current month and place them
        flatEvents.forEach(act => {
            const h = act.h;
            const ev = act.raw;

            // h.fecha comes in yyyy-mm-dd
            if (cellsMap.has(h.fecha)) {
                const block = document.createElement('div');

                // Styling based on is_public and modalidad
                let bg = '#1e293b';
                let bd = '#334155';
                let tc = '#f8fafc';
                let borderLeftColor = '#3b82f6';

                const isPublic = !!ev.is_public;
                const mod = (ev.modalidad || '').toLowerCase();

                if (mod.includes('virtual')) {
                    if (isPublic) { bg = '#047857'; bd = '#065f46'; tc = '#ffffff'; }
                    else { bg = '#dcfce3'; bd = '#bbf7d0'; tc = '#064e3b'; }
                } else if (mod.includes('presencial')) {
                    if (isPublic) { bg = '#c2410c'; bd = '#9a3412'; tc = '#ffffff'; }
                    else { bg = '#ffedd5'; bd = '#fed7aa'; tc = '#7c2d12'; }
                } else if (mod.includes('hibrido') || mod.includes('híbrido') || mod.includes('ambas')) {
                    if (isPublic) { bg = '#7e22ce'; bd = '#6b21a8'; tc = '#ffffff'; }
                    else { bg = '#f3e8ff'; bd = '#e9d5ff'; tc = '#581c87'; }
                }

                const lowerNombre = (ev.nombre + " " + ev.tipo).toLowerCase();

                if (lowerNombre.includes('audi') || lowerNombre.includes('pln') || lowerNombre.includes('reforzamiento')) {
                    borderLeftColor = '#06b6d4';
                } else if (lowerNombre.includes('taller')) {
                    if (lowerNombre.includes('carmen')) borderLeftColor = '#a3e635';
                    else if (lowerNombre.includes('finan')) borderLeftColor = '#86efac';
                    else if (lowerNombre.includes('docen') || lowerNombre.includes('docent')) borderLeftColor = '#fb923c';
                    else borderLeftColor = '#818cf8';
                } else if (lowerNombre.includes('testeo')) {
                    borderLeftColor = '#fde047';
                } else if (lowerNombre.includes('kick off')) {
                    borderLeftColor = '#fca5a5';
                } else {
                    if (ev.status === 7) borderLeftColor = '#10b981';
                    else if (ev.status > 0) borderLeftColor = '#3b82f6';
                    else borderLeftColor = '#64748b';
                }

                block.style.background = bg;
                block.style.border = `1px solid ${bd}`;
                block.style.borderLeft = `3px solid ${borderLeftColor}`;
                block.style.color = tc;
                block.style.padding = '8px 10px';
                block.style.fontSize = '0.9rem';
                block.style.lineHeight = '1.4';
                block.style.borderRadius = '6px';
                block.style.cursor = 'pointer';
                block.style.transition = 'transform 0.1s, box-shadow 0.1s';
                block.style.overflow = 'hidden';
                block.style.display = 'flex';
                block.style.flexDirection = 'column';
                block.style.gap = '4px';

                block.onmouseenter = () => { block.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.1)'; block.style.transform = 'scale(1.02)'; };
                block.onmouseleave = () => { block.style.boxShadow = 'none'; block.style.transform = 'scale(1)'; };
                block.onclick = () => {
                    playClickSound();
                    window.showDashboardEventDetails(ev);
                };

                const ponenteText = ev.ponente && ev.ponente.toLowerCase() !== 'pendiente' ? ev.ponente : 'Docente por Asignar';

                block.innerHTML = `
                    <div style="font-weight: 600; font-size: 0.95rem; color: #f8fafc; line-height: 1.2;">${ev.nombre}</div>
                    <div style="font-size: 0.8rem; color: #94a3b8; display: flex; align-items: center; gap: 4px;">
                        <i class="ph ph-user"></i> ${ponenteText}
                    </div>
                    <div style="font-size: 0.8rem; color: #94a3b8; display: flex; align-items: center; gap: 4px;">
                        <i class="ph ph-clock"></i> ${h.inicio} - ${h.fin}
                    </div>
                `;

                cellsMap.get(h.fecha).appendChild(block);
            }
        });

        // Setup Button Listeners only once to avoid stacking them
        const btnPrev = document.getElementById('btn-prev-month');
        const btnNext = document.getElementById('btn-next-month');

        // Remove old listeners using clone trick
        const newBtnPrev = btnPrev.cloneNode(true);
        const newBtnNext = btnNext.cloneNode(true);
        btnPrev.parentNode.replaceChild(newBtnPrev, btnPrev);
        btnNext.parentNode.replaceChild(newBtnNext, btnNext);

        newBtnPrev.addEventListener('click', () => {
            currentDashboardDate.setMonth(currentDashboardDate.getMonth() - 1);
            renderDashboardCalendar(events);
        });

        newBtnNext.addEventListener('click', () => {
            currentDashboardDate.setMonth(currentDashboardDate.getMonth() + 1);
            renderDashboardCalendar(events);
        });
    }

    function createCalendarCell(dayNumber, isMuted) {
        const cell = document.createElement('div');
        cell.style.background = 'var(--card-bg)';
        cell.style.minHeight = '140px';
        cell.style.padding = '8px';

        const dayLabel = document.createElement('div');
        dayLabel.textContent = dayNumber;
        dayLabel.style.fontWeight = 'bold';
        dayLabel.style.fontSize = '0.9rem';
        dayLabel.style.color = isMuted ? '#475569' : '#e2e8f0';

        // Highlight today
        const today = new Date();
        if (!isMuted && dayNumber === today.getDate() && currentDashboardDate.getMonth() === today.getMonth() && currentDashboardDate.getFullYear() === today.getFullYear()) {
            dayLabel.style.color = '#3b82f6'; // Blue text
            dayLabel.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
            dayLabel.style.display = 'inline-block';
            dayLabel.style.width = '24px';
            dayLabel.style.height = '24px';
            dayLabel.style.lineHeight = '24px';
            dayLabel.style.textAlign = 'center';
            dayLabel.style.borderRadius = '50%';
        }

        cell.appendChild(dayLabel);
        return cell;
    }

    // Sound Effect Utility
    function playClickSound() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.1);
            gainNode.gain.setValueAtTime(0.05, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
            osc.connect(gainNode);
            gainNode.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.1);
        } catch (e) { console.error("Could not play sound", e); }
    }

    // Modal popup for seeing dashboard event details
    window.showDashboardEventDetails = function (eventData) {
        if (!eventData) return;

        const isCancelled = eventData.estado_especial === 'Cancelado';
        const isPostponed = eventData.estado_especial === 'Postergado';

        let statusBadgeLabel = `${eventData.status}/7 ${getStatusText(eventData.status)}`;
        let statusColor = '#3b82f6'; // default blue
        if (isCancelled) {
            statusBadgeLabel = 'CANCELADO';
            statusColor = '#ef4444'; // red
        } else if (isPostponed) {
            statusBadgeLabel = `POSTERGADO (${eventData.status}/7)`;
            statusColor = '#f59e0b'; // amber
        } else if (eventData.status === 7) {
            statusColor = '#10b981'; // green
        }

        let typeIcon = '';
        const lowerModalidad = (eventData.modalidad || '').toLowerCase();

        if (lowerModalidad.includes('presencial')) {
            typeIcon = '<img src="presencial.png" alt="Presencial" style="width: 28px; height: 28px; vertical-align: middle; margin-right: 0.5rem;">';
        } else if (lowerModalidad.includes('híbrido') || lowerModalidad.includes('hibrido')) {
            typeIcon = '<img src="hibrido.png" alt="Híbrido" style="width: 28px; height: 28px; vertical-align: middle; margin-right: 0.5rem;">';
        } else if (lowerModalidad.includes('virtual')) {
            typeIcon = '<img src="virtual.png" alt="Virtual" style="width: 28px; height: 28px; vertical-align: middle; margin-right: 0.5rem;">';
        } else {
            typeIcon = '<i class="ph-duotone ph-calendar-blank" style="color: #64748b; font-size: 1.5rem; vertical-align: middle; margin-right: 0.5rem;"></i>';
        }

        let horariosHtml = '';
        try {
            const horarios = JSON.parse(eventData.horario || '[]');
            if (Array.isArray(horarios) && horarios.length > 0) {
                horarios.forEach(h => {
                    if (!h.fecha || !h.inicio) return;
                    const [y, m, d] = h.fecha.split('-');
                    const dateObj = new Date(y, m - 1, d);
                    const shortDate = dateObj.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
                    horariosHtml += `<div style="margin-left: 0.5rem; padding: 2px 0; color: #475569;">• <span style="text-transform: capitalize;">${shortDate}</span> | ${h.inicio} - ${h.fin}</div>`;
                });
            } else {
                horariosHtml = '<div style="margin-left: 0.5rem; color: #64748b;">No especificado</div>';
            }
        } catch (e) {
            horariosHtml = '<div style="margin-left: 0.5rem; color: #64748b;">No especificado</div>';
        }

        let sedeStr = eventData.sedes || eventData.lugar || 'Vía Zoom / Teams (o Virtual)';

        let htmlContent = `
            <div style="text-align: left; padding: 0.5rem; font-size: 0.95rem; color: #64748b; line-height: 1.6;">
                <p style="margin-bottom: 0.7rem; padding-bottom: 0.7rem; border-bottom: 1px solid rgba(0,0,0,0.1);">
                    <strong>Sede / Ubicación:</strong> <span style="color: #1e293b;">${sedeStr}</span>
                </p>
                <div style="margin-bottom: 0.7rem;">
                    <strong style="color: #1e293b;">Horario(s) y Días programados:</strong>
                    <div style="margin-top: 0.3rem; font-size: 0.9rem;">
                        ${horariosHtml}
                    </div>
                </div>
                <p style="margin-bottom: 0.7rem;"><strong>Tipo:</strong> <span style="color: #1e293b;">${eventData.tipo}</span></p>
                <p style="margin-bottom: 0.7rem;"><strong>Responsable:</strong> <span style="color: #1e293b;">${eventData.responsable || 'No especificado'}</span></p>
                <p style="margin-bottom: 1.2rem; padding: 8px; background: rgba(59,130,246,0.05); border-radius: 6px;">
                    <strong style="display:block; margin-bottom: 4px;">Descripción:</strong> 
                    <span style="color: #334155; font-size:0.9rem;">${eventData.descripcion_evento || 'Sin descripción'}</span>
                </p>
                <p style="margin-bottom: 0.7rem;"><strong>Modalidad:</strong> <span style="color: #1e293b;">${eventData.modalidad}</span></p>
                <p style="margin-bottom: 0.7rem;"><strong>Público Objetivo:</strong> <span style="color: #1e293b;">${eventData.audiencia || 'No especificado'}</span></p>
                <p><strong>Estado Actual:</strong> <span style="display:inline-block; margin-left: 0.5rem; padding: 0.2rem 0.6rem; background: ${statusColor}22; color: ${statusColor}; border-radius: 4px; font-weight: bold;">${statusBadgeLabel}</span></p>
            <div class="detail-label"><i class="ph ph-hash"></i> ID Sincronización</div>
            <div class="detail-value" style="font-family: monospace; font-size:0.8rem; background: rgba(255,255,255,0.05); padding: 2px 6px; border-radius:4px;">${eventData.sheet_id || 'Generado Localmente / No Sincronizado'}</div>
        </div>`;

        if (eventData.sustento) {
            htmlContent += `<div style="margin-top: 15px; padding: 12px; background: rgba(0,0,0,0.04); border-left: 3px solid ${statusColor}; border-radius: 4px;">
                                <strong style="font-size: 0.85rem; color: #475569;">Motivo Justificación:</strong><br>
                                <span style="font-size: 0.9rem; color: #1e293b;">${eventData.sustento}</span>
                            </div>`;
        }

        htmlContent += `</div>`;

        Swal.fire({
            title: `${typeIcon} <span style="vertical-align: middle;">${eventData.nombre}</span>`,
            html: htmlContent,
            showCancelButton: true,
            confirmButtonText: '<i class="ph ph-arrows-clockwise"></i> Gestionar Estado',
            cancelButtonText: 'Cerrar',
            confirmButtonColor: '#3b82f6', // solid blue to avoid css var issues making it invisible
            cancelButtonColor: '#475569',
            width: '36em',
            customClass: {
                title: 'text-left',
                htmlContainer: 'text-left'
            }
        }).then((result) => {
            if (result.isConfirmed) {
                // Navigate to the events tab
                const eventsTabLink = document.querySelector('.nav-btn[data-target="eventos"]');
                if (eventsTabLink) {
                    eventsTabLink.click();
                }

                // Then open the status modal. Delay a bit to ensure UI transitions don't clash
                setTimeout(() => {
                    const encodedData = encodeURIComponent(JSON.stringify(eventData));
                    if (typeof openStatusModal === 'function') {
                        openStatusModal(encodedData);
                    } else if (window.openStatusModal) {
                        window.openStatusModal(encodedData);
                    }
                }, 300);
            }
        });
    }

    // --- EVENT CRUD: Edit and Delete ---
    let currentEditEventId = null;

    window.deleteEvent = async function (eventId) {
        const result = await Swal.fire({
            title: '¿Está seguro?',
            text: '¿ESTÁ COMPLETAMENTE SEGURO de eliminar este evento? Esta acción no se puede deshacer.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#f87171',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (!result.isConfirmed) return;

        try {
            const { data, error } = await supabase
                .from('eventos')
                .delete()
                .eq('id', eventId)
                .select(); // Forzar a que devuelva lo eliminado para verificar RLS

            if (error) throw error;

            if (data && data.length === 0) {
                Swal.fire('Atención', 'El evento no se pudo eliminar. Parece que Supabase RLS (Row Level Security) está bloqueando la acción de eliminación (DELETE).', 'warning');
            } else {
                Swal.fire('Eliminado', 'Evento eliminado correctamente.', 'success');
                // Get the sheet_id to send down
                const originalEvent = allEventsData.find(e => String(e.id) === String(eventId));
                if (originalEvent) {
                    await syncToGoogleSheets("eliminar_evento", {
                        sheet_id: originalEvent.sheet_id,
                        nombre: originalEvent.nombre
                    });
                }
            }
            loadEvents();
        } catch (error) {
            console.error('Error deleting event:', error);
            Swal.fire('Error', 'Error al eliminar el evento: ' + error.message, 'error');
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

        // Ponente check if exists in options
        const selectPonente = document.getElementById('event-ponente');
        let ponenteFound = false;
        Array.from(selectPonente.options).forEach(opt => {
            if (opt.value === eventData.ponente) ponenteFound = true;
        });

        if (ponenteFound) {
            selectPonente.value = eventData.ponente;
        } else {
            selectPonente.value = 'Pendiente';
        }

        // Responsables (Múltiple Checkboxes)
        document.querySelectorAll('input[name="responsable"]').forEach(cb => cb.checked = false);
        if (eventData.responsable) {
            const respArr = eventData.responsable.split(',').map(s => s.trim());
            document.querySelectorAll('input[name="responsable"]').forEach(cb => {
                cb.checked = respArr.includes(cb.value);
            });
        }
        document.getElementById('event-descripcion').value = eventData.descripcion_evento || '';

        // Is Public Checkbox
        document.getElementById('event-is-public').checked = !!eventData.is_public;

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

        // Audience Reverse Parsing
        let cleanAud = eventData.audiencia || '';

        // Remove outer parenthesis if they exist (new format)
        if (cleanAud.startsWith('(') && cleanAud.endsWith(')')) {
            cleanAud = cleanAud.substring(1, cleanAud.length - 1).trim();
        }

        const detailInput = document.getElementById('audience-detail-input');
        const btnToggleAudienceDetail = document.getElementById('btn-toggle-audience-detail');

        let audBase = cleanAud;
        let detailText = '';

        // Match detail which is the inner parenthesis at the end of the text
        const detailMatch = cleanAud.match(/\(([^)]+)\)$/);
        if (detailMatch && detailMatch[1]) {
            detailText = detailMatch[1].trim();
            audBase = cleanAud.replace(/\([^)]+\)$/, '').trim();
        }

        if (detailText) {
            if (detailInput) {
                detailInput.value = detailText;
                detailInput.style.display = 'block';
            }
            if (btnToggleAudienceDetail) btnToggleAudienceDetail.innerHTML = '<i class="ph ph-minus"></i> Ocultar detalle';
        } else {
            if (detailInput) {
                detailInput.value = '';
                detailInput.style.display = 'none';
            }
            if (btnToggleAudienceDetail) btnToggleAudienceDetail.innerHTML = '<i class="ph ph-plus"></i> Añadir detalle específico (Opcional)';
        }

        const checksToSet = new Set();

        if (audBase.includes('Egresados')) checksToSet.add('Egresados');
        if (audBase.includes('Docentes') || audBase.includes('Comunidad académica')) checksToSet.add('Docentes');
        if (audBase.includes('Público en General') || audBase.includes('Público')) checksToSet.add('Publico');

        const allCycles = ['1', '2', '3', '4', '5', '6+'];
        if (audBase.includes('Todos los estudiantes') || audBase.includes('Comunidad académica')) {
            allCycles.forEach(c => checksToSet.add(c));
        } else {
            if (audBase.includes('1er')) checksToSet.add('1');
            if (audBase.includes('2do')) checksToSet.add('2');
            if (audBase.includes('3er')) checksToSet.add('3');
            if (audBase.includes('4to')) checksToSet.add('4');
            if (audBase.includes('5to')) checksToSet.add('5');
            if (audBase.includes('6to')) checksToSet.add('6+');

            const mapWordToNum = { '1er': 1, '2do': 2, '3er': 3, '4to': 4, '5to': 5 };
            const rangeMatch = audBase.match(/del (1er|2do|3er|4to|5to) al (2do|3er|4to|5to|6to)/);
            if (rangeMatch) {
                const start = mapWordToNum[rangeMatch[1]];
                let end = rangeMatch[2] === '6to' ? 6 : mapWordToNum[rangeMatch[2]];
                for (let i = start; i <= end; i++) checksToSet.add(i === 6 ? '6+' : String(i));
            }

            const aMasMatch = audBase.match(/de (1er|2do|3er|4to|5to|6to) a más/);
            if (aMasMatch) {
                const start = aMasMatch[1] === '6to' ? 6 : mapWordToNum[aMasMatch[1]];
                for (let i = start; i <= 6; i++) checksToSet.add(i === 6 ? '6+' : String(i));
            }
        }

        document.querySelectorAll('.audience-check').forEach(cb => {
            cb.checked = checksToSet.has(cb.value);
        });

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

    // --- Auto-Save Draft Logic ---
    function saveDraft() {
        if (currentEditEventId) return; // No auto-save in edit mode
        const draft = {
            tipo: document.getElementById('event-type').value,
            nombre: document.getElementById('event-name').value,
            ponente: document.getElementById('event-ponente').value,
            descripcion_evento: document.getElementById('event-descripcion').value,
            modalidad: document.querySelector('input[name="modality"]:checked')?.value || 'Presencial',
            is_public: document.getElementById('event-is-public').checked,
            sede: Array.from(document.querySelectorAll('input[name="sede"]:checked')).map(cb => cb.value),
            responsable: Array.from(document.querySelectorAll('input[name="responsable"]:checked')).map(cb => cb.value),
            audience_text: document.getElementById('audience-detail-input') ? document.getElementById('audience-detail-input').value : '',
            audience: Array.from(document.querySelectorAll('input[name="audience"]:checked')).map(cb => cb.value)
        };
        const scheduleRows = document.querySelectorAll('.schedule-row');
        draft.horario = Array.from(scheduleRows).map(row => {
            const inputs = row.querySelectorAll('input');
            return { fecha: inputs[0]?.value || '', inicio: inputs[1]?.value || '', fin: inputs[2]?.value || '' };
        });
        localStorage.setItem('draft_event_form', JSON.stringify(draft));
    }

    eventForm.addEventListener('change', saveDraft);
    eventForm.addEventListener('input', saveDraft);

    function loadDraft() {
        if (currentEditEventId) return false;
        const raw = localStorage.getItem('draft_event_form');
        if (!raw) return false;
        try {
            const draft = JSON.parse(raw);
            if (!draft.nombre && !draft.tipo && (!draft.horario || draft.horario.length === 0)) return false;

            document.getElementById('event-type').value = draft.tipo || 'Webinar';
            document.getElementById('event-name').value = draft.nombre || '';
            document.getElementById('event-descripcion').value = draft.descripcion_evento || '';

            const selectPonente = document.getElementById('event-ponente');
            let ponenteFound = false;
            Array.from(selectPonente.options).forEach(opt => {
                if (opt.value === draft.ponente) ponenteFound = true;
            });
            selectPonente.value = ponenteFound ? draft.ponente : 'Pendiente';
            if (typeof toggleDeletePonenteBtn === 'function') toggleDeletePonenteBtn();

            document.getElementById('event-is-public').checked = !!draft.is_public;

            if (draft.modalidad) {
                const modInput = document.querySelector(`input[name="modality"][value="${draft.modalidad}"]`);
                if (modInput) {
                    modInput.checked = true;
                    modInput.dispatchEvent(new Event('change'));
                }
            }

            document.querySelectorAll('input[name="sede"]').forEach(cb => cb.checked = false);
            if (draft.sede) {
                document.querySelectorAll('input[name="sede"]').forEach(cb => {
                    if (draft.sede.includes(cb.value)) cb.checked = true;
                });
            }

            document.querySelectorAll('input[name="responsable"]').forEach(cb => cb.checked = false);
            if (draft.responsable) {
                document.querySelectorAll('input[name="responsable"]').forEach(cb => {
                    if (draft.responsable.includes(cb.value)) cb.checked = true;
                });
            }

            document.querySelectorAll('input[name="audience"]').forEach(cb => cb.checked = false);
            if (draft.audience) {
                document.querySelectorAll('input[name="audience"]').forEach(cb => {
                    if (draft.audience.includes(cb.value)) cb.checked = true;
                });
            }

            const autodetails = document.getElementById('audience-detail-input');
            if (autodetails) autodetails.value = draft.audience_text || '';

            if (draft.horario && draft.horario.length) {
                scheduleList.innerHTML = '';
                draft.horario.forEach(h => createScheduleRow(h.fecha, h.inicio, h.fin));
            } else {
                scheduleList.innerHTML = '';
                createScheduleRow();
            }
            if (typeof updateAudienceSummary === 'function') updateAudienceSummary();
            return true;
        } catch (e) { return false; }
    }

    // --- Create Event Button Reset Logic ---
    if (openModalBtn) {
        openModalBtn.addEventListener('click', () => {
            currentEditEventId = null;
            document.querySelector('#event-modal h2').innerHTML = '<i class="ph ph-calendar-plus"></i> Crear Nuevo Evento';
            document.querySelector('#event-form button[type="submit"]').textContent = 'Guardar Evento';

            // Try to load draft first
            if (!loadDraft()) {
                eventForm.reset();
                scheduleList.innerHTML = '';
                createScheduleRow();
                if (typeof updateAudienceSummary === 'function') updateAudienceSummary();
            }
            modal.classList.add('active');
        });
    }

    // Listeners for Cancelling Modal
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Only relevant if this is the generic cancel button in the event form
            if (e.target.closest('#event-form') && !currentEditEventId) {
                const draft = localStorage.getItem('draft_event_form');
                if (draft && draft.length > 10) {
                    Swal.fire({
                        title: '¿Descartar borrador?',
                        text: "Tienes datos sin guardar. Si cancelas se perderá el progreso.",
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonText: 'Sí, descartar',
                        cancelButtonText: 'No, mantener'
                    }).then((result) => {
                        if (result.isConfirmed) {
                            localStorage.removeItem('draft_event_form');
                            const m = e.target.closest('.modal-overlay');
                            if (m) m.classList.remove('active');
                        }
                    });
                    // Stop the generic close from happening immediately, handled by SwitAlert
                    e.preventDefault();
                    e.stopPropagation();
                    return;
                }
            }
        });
    });

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

        // Formateo Nativo antes de mandar a Supabase (Web App como Single Source of Truth)
        let audText = document.getElementById('audience-summary-text').textContent || '';
        if (audText === '-') {
            audText = '';
        }

        // Remove description fallback: if blank, stay blank.
        let descText = document.getElementById('event-descripcion').value.trim();

        // Build Data Payload
        const data = {
            tipo: document.getElementById('event-type').value,
            nombre: document.getElementById('event-name').value,
            ponente: document.getElementById('event-ponente').value.trim() || 'Pendiente',
            responsable: Array.from(document.querySelectorAll('input[name="responsable"]:checked')).map(cb => cb.value).join(', '),
            descripcion_evento: descText,
            is_public: document.getElementById('event-is-public').checked,
            modalidad: document.querySelector('input[name="modality"]:checked').value,
            sedes: sedes,
            horario: JSON.stringify(schedule),
            audiencia: audText
        };

        if (!currentEditEventId) {
            data.status = 0; // Default start status only for new events

            // Generate sheet_id BEFORE inserting into Supabase to prevent duplicate row bugs
            const mesi = new Date().getMonth();
            const mesesA = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
            const rowNumber = (window.allEventsData ? window.allEventsData.length : 0) + 2;
            const rnd = Math.random().toString(36).substr(2, 3).toUpperCase();
            data.sheet_id = `${rowNumber}${mesesA[mesi]}-${rnd}`;
        }

        try {
            if (currentEditEventId) {
                // UPDATE EXISTING EVENT
                const { error: updateError } = await supabase
                    .from('eventos')
                    .update(data)
                    .eq('id', currentEditEventId);

                if (updateError) throw updateError;

                // Get the old sheet_id to send down
                const originalEvent = allEventsData.find(e => e.id === currentEditEventId);
                data.sheet_id = originalEvent ? originalEvent.sheet_id : null;
                await syncToGoogleSheets("actualizar_evento", data);
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'success',
                    title: '¡Evento actualizado exitosamente!',
                    showConfirmButton: false,
                    timer: 3000
                });
                currentEditEventId = null;
            } else {
                // CREATE NEW EVENT
                const { error: insertError } = await supabase
                    .from('eventos')
                    .insert([data]);

                if (insertError) throw insertError;

                // Sync as Action: crear_evento
                await syncToGoogleSheets("crear_evento", data);

                // ¡EVENTO CREADO EXITOSAMENTE EN BD LOCAL!
                try { localStorage.removeItem('draft_event_form'); } catch (e) { }

                try {
                    // Removed old webhook code because it's now handled by syncToGoogleSheets 
                    // which is called above after inserting/updating.
                } catch (e) {
                    console.error("Error procesando autoguardado a sheets:", e);
                    Swal.fire('¡Éxito!', 'Evento guardado exitosamente en BD local (Error en sync a Sheets).', 'success');
                }
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
            Swal.fire('Error', 'Hubo un error al guardar el evento: ' + error.message, 'error');
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });

    // --- STATUS WORKFLOW LOGIC ---

    // Definition of the 7-step flow
    const STATUS_FLOW = [
        {
            id: 0,
            label: 'En proyecto',
            req: [
                { id: 'comunicado_eq', label: '¿Se ha comunicado al equipo sobre el evento?' },
                { id: 'aprobado_eq', label: '¿Lo han aprobado?' }
            ]
        },
        {
            id: 1,
            label: 'Planificado',
            req: [
                { id: 'carpeta_evento', label: '¿Desea crear la carpeta del evento?', type: 'action_drive' },
                { id: 'coordinado_ponente', label: '¿Ha coordinado con el ponente?' },
                { id: 'aceptado_ponente', label: '¿Ha aceptado el ponente?' }
            ]
        },
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
        const btnRetroceder = document.getElementById('btn-retroceder-status');

        // Populate Info
        let ponenteHtml = '';
        if (!eventData.ponente || eventData.ponente.toLowerCase() === 'pendiente') {
            ponenteHtml = `
                <div style="margin-top: 1rem; padding: 0.5rem; background: rgba(245, 158, 11, 0.1); border-left: 3px solid #f59e0b; border-radius: 4px;">
                    <label style="color:var(--text-muted); font-size:0.85rem; font-weight: bold;">Asignar Ponente (Requerido para avanzar):</label>
                    <input type="text" id="status-ponente-input" class="input-modern small" placeholder="Nombre completo del ponente" style="width:100%; margin-top:0.3rem;" required>
                </div>
            `;
        } else {
            ponenteHtml = `<p style="color:var(--text-muted); margin-top: 0.5rem;"><i class="ph ph-user"></i> Ponente: <strong style="color: #f8fafc;">${eventData.ponente}</strong></p>`;
        }
        infoDiv.innerHTML = `<h3>${eventData.nombre}</h3><p style="color:var(--text-muted)">${eventData.tipo} - ${eventData.modalidad}</p>${ponenteHtml}`;

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
        btnAdvance.disabled = false; // Siempre activo para mostrar advertencia
        let isStepCompletable = false;

        if (nextStep <= 7) {
            const stepConfig = STATUS_FLOW.find(s => s.id === currentStep); // Requirements to *leave* current or *enter* next? Assuming requirements to complete current -> next.
            // User description says: "1/7 Planificado ... Req foto". "3/7 Comunicado ... se debe ir al enlace".
            // So these are requirements to BE in that stage or to PASS that stage?
            // "cuando este en el paso 3 para completarse se debe ir al enlace" -> Requirements to finish Step 3 (move to 4).

            const configForCurrent = STATUS_FLOW.find(s => s.id === currentStep);

            if (configForCurrent) {
                if (Array.isArray(configForCurrent.req)) {
                    // --- NUEVA LÓGICA: Preguntas Personalizadas Sí/No (JSONB Persistente) ---
                    let reqData = {};
                    try {
                        reqData = typeof eventData.requisitos === 'string' ? JSON.parse(eventData.requisitos) : (eventData.requisitos || {});
                    } catch (e) { }

                    const evaluateAdvanceButton = () => {
                        let ok = true;
                        configForCurrent.req.forEach(r => {
                            if (reqData[r.id] !== true) ok = false;
                        });

                        // Extra validation for Step 1 (Planificado): Require 'Ponente'
                        if (currentStep === 1) {
                            if (!eventData.ponente || eventData.ponente.toLowerCase() === 'pendiente') {
                                ok = false;
                            }
                        }

                        isStepCompletable = ok;
                    };

                    const updateReqsInDB = async (newReqData) => {
                        try {
                            const { error } = await supabase.from('eventos').update({ requisitos: newReqData }).eq('id', eventData.id);
                            if (error) throw error;
                            // Update local memory so we don't lose it if we close and reopen modal without full refresh
                            const localEv = allEventsData.find(e => e.id === eventData.id);
                            if (localEv) localEv.requisitos = newReqData;
                            eventData.requisitos = newReqData;
                        } catch (e) {
                            console.error("Error guardando checklist en DB:", e);
                        }
                    };

                    configForCurrent.req.forEach(r => {
                        const li = document.createElement('li');
                        li.style.display = 'flex';
                        li.style.justifyContent = 'space-between';
                        li.style.alignItems = 'center';
                        li.style.padding = '12px 0';
                        li.style.borderBottom = '1px solid rgba(255,255,255,0.05)';

                        // Soportar tres estados: true, false, y undefined
                        const val = reqData[r.id];

                        // --- SPECIAL LOGIC FOR ACTION_DRIVE (CREATE FOLDER) ---
                        if (r.type === 'action_drive') {
                            const hasFolder = !!reqData.folder_url && !reqData.folder_url.includes("1nyN81gZicYLBW6RyEHb_wZmEQoyqutps");

                            // Si ya tiene carpeta:
                            if (hasFolder) {
                                li.innerHTML = `
                                    <div style="flex:1; padding-right: 15px;">
                                        <label style="font-size: 0.95rem; color: #cbd5e1; user-select: none;">${r.label}</label>
                                    </div>
                                    <div style="display: flex; gap: 15px; align-items: center; user-select: none;" id="verify-drive-box-${r.id}">
                                        <span style="color: #64748b; font-size: 0.85rem;"><i class="ph ph-spinner ph-spin"></i> Verificando Drive...</span>
                                    </div>
                                `;
                                reqList.appendChild(li);

                                // Async Verification
                                (async () => {
                                    try {
                                        const response = await fetch(GOOGLE_APP_SCRIPT_WEBHOOK_URL, {
                                            method: 'POST',
                                            mode: 'cors',
                                            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                                            body: JSON.stringify({ action: 'verificar_carpeta_evento', data: { folder_url: reqData.folder_url } })
                                        });
                                        const result = await response.json();

                                        const box = document.getElementById(`verify-drive-box-${r.id}`);
                                        if (box) {
                                            if (result.status === "ok" && result.exists === true) {
                                                box.innerHTML = `
                                                    <span style="color: #10b981; font-weight: bold; font-size: 0.85rem;"><i class="ph ph-check-circle"></i> CARPETA CREADA</span>
                                                    <a href="${reqData.folder_url}" target="_blank" class="btn-primary" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; border-radius: 4px; display:inline-flex; align-items:center; gap: 0.3rem;"><i class="ph ph-folder-open"></i> Ir a carpeta</a>
                                                `;
                                                reqData[r.id] = true;
                                                evaluateAdvanceButton(); // Allow advance
                                            } else {
                                                // Folder was deleted in Drive. Revert state.
                                                delete reqData.folder_url;
                                                reqData[r.id] = false;
                                                await updateReqsInDB(reqData);
                                                // Refresh the entire modal so it rerenders as the Si/No buttons
                                                openStatusModal(encodeURIComponent(JSON.stringify(eventData)));
                                            }
                                        }
                                    } catch (e) {
                                        console.error("Error verificando carpeta:", e);
                                        // On network error just assume it's created to avoid blocking the user
                                        const box = document.getElementById(`verify-drive-box-${r.id}`);
                                        if (box) {
                                            box.innerHTML = `
                                                <span style="color: #10b981; font-weight: bold; font-size: 0.85rem;"><i class="ph ph-check-circle"></i> CARPETA CREADA</span>
                                                <a href="${reqData.folder_url}" target="_blank" class="btn-primary" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; border-radius: 4px; display:inline-flex; align-items:center; gap: 0.3rem;"><i class="ph ph-folder-open"></i> Ir a carpeta</a>
                                            `;
                                            reqData[r.id] = true;
                                            evaluateAdvanceButton();
                                        }
                                    }
                                })();

                                return; // Skip normal listeners setup for now
                            }

                            // Si NO tiene carpeta: Muestra el UI estandar pero pre-conectado a la acción
                            li.innerHTML = `
                                <div style="flex:1; padding-right: 15px;">
                                    <label style="font-size: 0.95rem; color: #cbd5e1; user-select: none;">${r.label}</label>
                                </div>
                                <div style="display: flex; gap: 15px; align-items: center; user-select: none;">
                                    <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-size:0.9rem; transition: color 0.2s;" class="custom-lbl-no">
                                        <span class="lbl-no-txt" style="font-weight: 500;">No</span>
                                        <div class="custom-cb-box no-box" style="width: 24px; height: 24px; border-radius: 6px; display:inline-flex; align-items:center; justify-content:center; transition: all 0.2s; border: 1.5px solid #475569;">
                                            <svg class="no-icon" style="width:14px; height:14px; opacity:0; transition: opacity 0.2s;" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"></path></svg>
                                        </div>
                                    </label>
                                    <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-size:0.9rem; transition: color 0.2s;" class="custom-lbl-yes" id="btn-create-drive-${r.id}">
                                        <span class="lbl-yes-txt" style="font-weight: 500;">Sí</span>
                                        <div class="custom-cb-box yes-box" style="width: 24px; height: 24px; border-radius: 6px; display:inline-flex; align-items:center; justify-content:center; transition: all 0.2s; border: 1.5px solid #475569;">
                                            <svg class="yes-icon" style="width:14px; height:14px; opacity:0; transition: opacity 0.2s;" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
                                        </div>
                                    </label>
                                </div>
                            `;
                            reqList.appendChild(li);

                            const lblNoTxt = li.querySelector('.lbl-no-txt');
                            const boxNo = li.querySelector('.no-box');
                            const noIcon = li.querySelector('.no-icon');
                            const lblNoContainer = li.querySelector('.custom-lbl-no');
                            const btnCreateDrive = document.getElementById(`btn-create-drive-${r.id}`);

                            // Estilo básico para "No" o neutral
                            const applyStylesDrive = (stateVal) => {
                                lblNoTxt.style.color = '#64748b';
                                boxNo.style.borderColor = '#475569'; boxNo.style.background = 'transparent'; noIcon.style.opacity = '0';

                                if (stateVal === false || stateVal === undefined) {
                                    lblNoTxt.style.color = '#ef4444';
                                    boxNo.style.borderColor = 'rgba(239, 68, 68, 0.4)'; boxNo.style.background = 'rgba(239, 68, 68, 0.2)';
                                    noIcon.style.opacity = '1'; noIcon.style.color = '#ef4444';
                                }
                            };

                            applyStylesDrive(val);

                            lblNoContainer.addEventListener('click', () => {
                                reqData[r.id] = false;
                                applyStylesDrive(false);
                                evaluateAdvanceButton();
                                updateReqsInDB(reqData);
                            });

                            btnCreateDrive.addEventListener('click', async () => {
                                // Evitar dobles clicks
                                if (btnCreateDrive.style.pointerEvents === 'none') return;

                                // Reset No
                                reqData[r.id] = false; applyStylesDrive(undefined);

                                // UI Loading
                                btnCreateDrive.style.pointerEvents = 'none';
                                btnCreateDrive.innerHTML = `<span style="color:#64748b; font-size:0.85rem;"><i class="ph ph-spinner ph-spin"></i> Creando...</span>`;
                                btnAdvance.disabled = true;

                                // Format Folder name: DD/MM Ponente Tipo
                                let dayStr = "00", monStr = "00";
                                try {
                                    const horariosStr = eventData.horario || '[]';
                                    const horarios = typeof horariosStr === 'string' ? JSON.parse(horariosStr) : horariosStr;
                                    if (horarios.length > 0 && horarios[0].fecha) {
                                        const fi = String(horarios[0].fecha).trim();
                                        if (fi.includes('/')) {
                                            const p = fi.split('/');
                                            dayStr = p[0].padStart(2, '0');
                                            monStr = p[1].padStart(2, '0');
                                        } else if (fi.includes('-')) {
                                            const p = fi.split('-');
                                            if (p[0].length === 4) { // YYYY-MM-DD
                                                monStr = p[1].padStart(2, '0');
                                                dayStr = p[2].padStart(2, '0');
                                            } else { // DD-MM-YYYY
                                                dayStr = p[0].padStart(2, '0');
                                                monStr = p[1].padStart(2, '0');
                                            }
                                        } else {
                                            const dateObj = new Date(fi + "T00:00:00");
                                            if (!isNaN(dateObj)) {
                                                dayStr = String(dateObj.getDate()).padStart(2, '0');
                                                monStr = String(dateObj.getMonth() + 1).padStart(2, '0');
                                            }
                                        }
                                    }
                                } catch (e) {
                                    console.error("No se pudo parsear el horario para la fecha:", e);
                                }
                                const folderName = `${dayStr}/${monStr} ${eventData.nombre} ${eventData.tipo}`;

                                let eventHorarioStr = "la fecha programada";
                                try {
                                    const hStr = eventData.horario || '[]';
                                    const hrs = typeof hStr === 'string' ? JSON.parse(hStr) : hStr;
                                    if (hrs.length > 0 && hrs[0].fecha) {
                                        eventHorarioStr = `${hrs[0].fecha} desde las ${hrs[0].inicio || ''} hasta las ${hrs[0].fin || ''}`;
                                    }
                                } catch (e) { }

                                try {
                                    // Petición real esperando respuesta JSON
                                    const response = await fetch(GOOGLE_APP_SCRIPT_WEBHOOK_URL, {
                                        method: 'POST',
                                        mode: 'cors',
                                        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                                        body: JSON.stringify({
                                            action: 'crear_carpeta_evento', data: {
                                                folder_name: folderName,
                                                event_name: eventData.nombre || "",
                                                event_horario_str: eventHorarioStr
                                            }
                                        })
                                    });

                                    const result = await response.json();

                                    if (result.status === "ok" && result.folder_url) {
                                        reqData.folder_url = result.folder_url;
                                        reqData[r.id] = true;
                                        await updateReqsInDB(reqData);

                                        // Refresh UI immediately to show the "CARPETA CREADA" state
                                        btnCreateDrive.style.pointerEvents = 'auto'; // restore
                                        openStatusModal(encodeURIComponent(JSON.stringify(eventData)));
                                    } else {
                                        throw new Error(result.error || "Error desconocido de GAS");
                                    }

                                } catch (err) {
                                    console.error("Error solicitando creación de carpeta:", err);
                                    btnCreateDrive.innerHTML = `<span class="lbl-yes-txt" style="font-weight: 500;">Sí</span>`;
                                    btnCreateDrive.style.pointerEvents = 'auto';
                                    applyStylesDrive(undefined);
                                    Swal.fire('Error', 'No se pudo contactar con el servidor de Google Drive.', 'error');
                                }
                            });

                            return; // Stop normal logic
                        } else {
                            // --- NORMAL YES/NO CHECKBOXES ---
                            li.innerHTML = `
                                <div style="flex:1; padding-right: 15px;">
                                    <label style="font-size: 0.95rem; color: #cbd5e1; user-select: none;">${r.label}</label>
                                </div>
                                <div style="display: flex; gap: 15px; align-items: center; user-select: none;">
                                    <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-size:0.9rem; transition: color 0.2s;" class="custom-lbl-no">
                                        <span class="lbl-no-txt" style="font-weight: 500;">No</span>
                                        <div class="custom-cb-box no-box" style="width: 24px; height: 24px; border-radius: 6px; display:inline-flex; align-items:center; justify-content:center; transition: all 0.2s; border: 1.5px solid #475569;">
                                            <svg class="no-icon" style="width:14px; height:14px; opacity:0; transition: opacity 0.2s;" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"></path></svg>
                                        </div>
                                    </label>
                                    <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-size:0.9rem; transition: color 0.2s;" class="custom-lbl-yes">
                                        <span class="lbl-yes-txt" style="font-weight: 500;">Sí</span>
                                        <div class="custom-cb-box yes-box" style="width: 24px; height: 24px; border-radius: 6px; display:inline-flex; align-items:center; justify-content:center; transition: all 0.2s; border: 1.5px solid #475569;">
                                            <svg class="yes-icon" style="width:14px; height:14px; opacity:0; transition: opacity 0.2s;" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
                                        </div>
                                    </label>
                                </div>
                            `;
                            reqList.appendChild(li);

                            const lblNoTxt = li.querySelector('.lbl-no-txt');
                            const lblYesTxt = li.querySelector('.lbl-yes-txt');
                            const boxNo = li.querySelector('.no-box');
                            const boxYes = li.querySelector('.yes-box');
                            const noIcon = li.querySelector('.no-icon');
                            const yesIcon = li.querySelector('.yes-icon');
                            const lblNoContainer = li.querySelector('.custom-lbl-no');
                            const lblYesContainer = li.querySelector('.custom-lbl-yes');

                            // Function to apply styles based on boolean state (true, false, undefined)
                            const applyStyles = (stateVal) => {
                                // 1. Reset everything to gray/ghost state (Unselected)
                                lblYesTxt.style.color = '#64748b';
                                boxYes.style.borderColor = '#475569'; boxYes.style.background = 'transparent'; yesIcon.style.opacity = '0';

                                lblNoTxt.style.color = '#64748b';
                                boxNo.style.borderColor = '#475569'; boxNo.style.background = 'transparent'; noIcon.style.opacity = '0';

                                // 2. Apply colors if actively selected
                                if (stateVal === true) {
                                    lblYesTxt.style.color = '#64748b';
                                    boxYes.style.borderColor = '#10b981'; boxYes.style.background = 'transparent';
                                    yesIcon.style.opacity = '1'; yesIcon.style.color = '#10b981';
                                } else if (stateVal === false || stateVal === undefined) {
                                    lblNoTxt.style.color = '#ef4444';
                                    boxNo.style.borderColor = 'rgba(239, 68, 68, 0.4)'; boxNo.style.background = 'rgba(239, 68, 68, 0.2)';
                                    noIcon.style.opacity = '1'; noIcon.style.color = '#ef4444';
                                }
                            };

                            // Initial render
                            applyStyles(val);

                            // Attach listeners
                            lblNoContainer.addEventListener('click', () => {
                                reqData[r.id] = false;
                                applyStyles(false);
                                evaluateAdvanceButton();
                                updateReqsInDB(reqData);
                            });

                            lblYesContainer.addEventListener('click', () => {
                                reqData[r.id] = true;
                                applyStyles(true);
                                evaluateAdvanceButton();
                                updateReqsInDB(reqData);
                            });
                        }
                    });

                    evaluateAdvanceButton();

                } else {
                    // --- VIEJA LÓGICA: Checkbox nativo básico para los demás estados ---
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

                    li.innerHTML = `${checkHtml} <div style="flex:1">${labelHtml}</div> ${actionHtml}`;
                    reqList.appendChild(li);

                    // Enable button on check
                    li.querySelector('.req-check').addEventListener('change', (e) => {
                        isStepCompletable = e.target.checked;
                    });
                }
            }
        }

        modal.classList.add('active');

        // Setup Buttons
        btnAdvance.onclick = () => {
            if (!isStepCompletable && currentStep < 7) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Falta completar requisitos',
                    text: 'Debe marcar y cumplir con todos los requisitos listados en esta etapa antes de poder avanzar.',
                    confirmButtonColor: '#8b5cf6'
                });
                return;
            }

            const ponenteInput = document.getElementById('status-ponente-input');
            let newPonente = null;
            if (ponenteInput) {
                newPonente = ponenteInput.value.trim();
                if (!newPonente || newPonente.toLowerCase() === 'pendiente') {
                    Swal.fire('Atención', 'Debe asignar un ponente válido para poder avanzar de estado.', 'warning');
                    return;
                }
            }
            advanceStatus(eventData, nextStep, false, newPonente);
        };

        if (currentStep > 0 && eventData.estado_especial !== 'Cancelado' && eventData.estado_especial !== 'Postergado') {
            btnRetroceder.style.display = 'inline-flex';
            btnRetroceder.onclick = () => advanceStatus(eventData, currentStep - 1, true);
        } else {
            btnRetroceder.style.display = 'none';
        }

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

        btnConfirmSpecial.onclick = async () => {
            const motivo = sustentoText.value.trim();
            if (!motivo) {
                Swal.fire('Atención', 'Por favor ingrese el sustento (requerido).', 'warning');
                return;
            }
            if (pendingSpecialAction === 'Cancelado') {
                const result = await Swal.fire({
                    title: '¿Cancelar evento?',
                    text: '¿ESTÁ COMPLETAMENTE SEGURO de cancelar este evento de forma definitiva? No hay vuelta atrás.',
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#f87171',
                    cancelButtonColor: '#6b7280',
                    confirmButtonText: 'Sí, cancelar evento',
                    cancelButtonText: 'Volver'
                });
                if (!result.isConfirmed) return;
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

            // Sync status to sheets
            const originalEvent = allEventsData.find(e => e.id === eventId);
            if (originalEvent) {
                await syncToGoogleSheets("actualizar_estado", {
                    sheet_id: originalEvent.sheet_id,
                    status: originalEvent.status,
                    estado_especial: actionName
                });
            }

            Swal.fire('¡Éxito!', 'Evento marcado como ' + actionName + ' exitosamente.', 'success');
            document.getElementById('status-modal').classList.remove('active');
            loadEvents();
        } catch (e) {
            console.error(e);
            Swal.fire('Error', "Error al actualizar: " + e.message, 'error');
        }
    }

    async function resumeEvent(eventData) {
        const result = await Swal.fire({
            title: '¿Reanudar evento?',
            text: '¿Desea reanudar este evento postergado?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: 'var(--primary-color)',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Sí, reanudar',
            cancelButtonText: 'Cancelar'
        });

        if (!result.isConfirmed) return;

        try {
            const { error: updateError } = await supabase
                .from('eventos')
                .update({ estado_especial: null, sustento: null })
                .eq('id', eventData.id);

            if (updateError) throw updateError;

            // Sync status to sheets
            await syncToGoogleSheets("actualizar_estado", {
                sheet_id: eventData.sheet_id,
                status: eventData.status,
                estado_especial: ""
            });

            Swal.fire('¡Éxito!', 'Evento reanudado exitosamente.', 'success');
            document.getElementById('status-modal').classList.remove('active');
            loadEvents();
        } catch (e) {
            console.error(e);
            Swal.fire('Error', "Error al reanudar: " + e.message, 'error');
        }
    }

    async function advanceStatus(eventData, targetStep, isRetroceder = false, newPonente = null) {
        // Se omiten los popups nativos de confirmación por pedido del usuario para un flujo más ágil
        // Proceder directamente o mostrar notificaciones minificadas.

        // Logic for redirects UPON transition
        if (!isRetroceder) {
            const flowConfig = STATUS_FLOW.find(s => s.id === targetStep); // Config of the NEW step
            if (flowConfig && flowConfig.redirect) {
                // Redirect happens
                document.querySelector(`[data-target="${flowConfig.redirect}"]`).click();
            }
        }

        try {
            const updatePayload = { status: targetStep };
            if (newPonente) {
                updatePayload.ponente = newPonente;
                eventData.ponente = newPonente;
            }

            const { error: updateError } = await supabase
                .from('eventos')
                .update(updatePayload)
                .eq('id', eventData.id);

            if (updateError) {
                throw updateError;
            }

            // Sync status to sheets
            await syncToGoogleSheets("actualizar_estado", {
                sheet_id: eventData.sheet_id,
                status: targetStep,
                estado_especial: eventData.estado_especial || "",
                ponente: newPonente || eventData.ponente
            });

            Swal.fire({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
                icon: 'success',
                title: `Estado actualizado a: ${getStatusText(targetStep)}`
            });

            document.getElementById('status-modal').classList.remove('active');
            loadEvents(); // Reload Events Sync immediately

        } catch (e) {
            Swal.fire('Error', 'Error al actualizar (Ver consola)', 'error');
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


    // --- REAL-TIME UNI-DIRECTIONAL SYNC TO GOOGLE SHEETS --- //
    async function syncToGoogleSheets(action, dataObj) {
        if (!GOOGLE_APP_SCRIPT_WEBHOOK_URL) return;

        // Forma un payload consistente similar a cómo lo hacía crear_evento originalmente 
        // pero adaptado para todas las acciones (crear, actualizar, eliminar, actualizar_estado).

        let webhookPayload = {
            action: action,
            data: { ...dataObj }
        };

        if (action === 'crear_evento' || action === 'actualizar_evento') {
            const meses = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
            let fechaInicioStr = '', fechaFinStr = '', primeraHora = '', mesNombre = '';

            try {
                const schedule = JSON.parse(dataObj.horario || '[]');
                if (schedule && schedule.length > 0) {
                    const partesIni = schedule[0].fecha.split('-');
                    if (partesIni.length === 3) fechaInicioStr = `${partesIni[2]}/${partesIni[1]}/${partesIni[0]}`;

                    const partesFin = schedule[schedule.length - 1].fecha.split('-');
                    if (partesFin.length === 3) fechaFinStr = `${partesFin[2]}/${partesFin[1]}/${partesFin[0]}`;

                    if (partesIni.length === 3) {
                        const [yyyy, mm, dd] = partesIni;
                        const iniObj = new Date(yyyy, mm - 1, dd);
                        mesNombre = meses[iniObj.getMonth()] || '';
                    }

                    if (schedule[0].inicio) {
                        const [hh, mm] = schedule[0].inicio.split(':');
                        let mH = parseInt(hh, 10);
                        let ampm = mH >= 12 ? 'p. m.' : 'a. m.';
                        mH = mH % 12 || 12;
                        primeraHora = `${mH}:${mm} ${ampm}`;
                    }
                }
            } catch (e) { }

            let finalSede = dataObj.sedes ? dataObj.sedes : 'Todas';

            webhookPayload.data = {
                mes: mesNombre,
                fecha_inicio: fechaInicioStr,
                fecha_fin: fechaFinStr,
                hora: primeraHora,
                tipo: dataObj.tipo,
                nombre: dataObj.nombre,
                descripcion: (dataObj.descripcion_evento || '').trim(),
                ponente: dataObj.ponente && dataObj.ponente !== 'Pendiente' ? dataObj.ponente : '',
                audiencia: dataObj.audiencia,
                modalidad: dataObj.modalidad,
                sedes: finalSede,
                responsable: dataObj.responsable || '',
                sheet_id: dataObj.sheet_id,
                is_public: dataObj.is_public ? true : false,
                status: dataObj.status
            };
        }

        try {
            await fetch(GOOGLE_APP_SCRIPT_WEBHOOK_URL, {
                method: "POST",
                mode: "no-cors",
                headers: { "Content-Type": "text/plain" },
                body: JSON.stringify(webhookPayload)
            });
            console.log("✅ Sync To Sheets successful for action:", action);
        } catch (e) {
            console.error("❌ Error en webhook de Google Sheets:", e);
        }
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

    // --- IMPORTADOR DESDE GOOGLE SHEETS EXCEL ---
    const importExcelBtn = document.getElementById('btn-import-excel');
    const importExcelModal = document.getElementById('import-event-modal');
    const importExcelData = document.getElementById('import-event-data');
    const importPreview = document.getElementById('import-preview');
    const importPreviewContent = document.getElementById('import-preview-content');
    const btnProcessImport = document.getElementById('btn-process-import');
    const btnSyncUrl = document.getElementById('btn-sync-url');
    const sheetUrlInput = document.getElementById('sheet-url-input');

    let parsedImportEventData = null;

    if (importExcelBtn) {
        importExcelBtn.addEventListener('click', () => {
            if (importExcelData) importExcelData.value = '';
            if (sheetUrlInput) sheetUrlInput.value = '';
            if (importPreview) importPreview.classList.add('hidden');
            if (btnProcessImport) btnProcessImport.disabled = true;
            if (importExcelModal) importExcelModal.classList.add('active');
            parsedImportEventData = null;
        });
    }

    // Lógica para exportación por URL (Sincronización Automática)
    if (btnSyncUrl && sheetUrlInput) {
        btnSyncUrl.addEventListener('click', async () => {
            const url = sheetUrlInput.value.trim();
            if (!url) {
                Swal.fire('Atención', 'Por favor, ingresa el enlace de tu Google Sheets.', 'warning');
                return;
            }

            // Expresión regular para extraer ID del documento y (opcional) el GID de la hoja
            const idMatch = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
            if (!idMatch) {
                Swal.fire('Error', 'No se pudo identificar un ID de Google Sheets válido en este enlace.', 'error');
                return;
            }

            const docId = idMatch[1];
            const gidMatch = url.match(/[#&]gid=([0-9]+)/);
            const gid = gidMatch ? gidMatch[1] : '0';

            const csvUrl = `https://docs.google.com/spreadsheets/d/${docId}/export?format=csv&gid=${gid}`;

            // Cambiamos estado de botón
            const originalText = btnSyncUrl.innerHTML;
            btnSyncUrl.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Cargando...';
            btnSyncUrl.disabled = true;

            try {
                const response = await fetch(csvUrl);
                if (!response.ok) {
                    throw new Error(`CÓDIGO DE RED HTTP: ${response.status}`);
                }
                const csvText = await response.text();

                // Utilizamos PapaParse para un procesado CSV robusto (manejo de comas internas, saltos de linea, etc)
                if (window.Papa) {
                    const parsed = Papa.parse(csvText, { skipEmptyLines: true });
                    if (parsed.data && parsed.data.length > 0) {
                        // Construimos una pseudo variable tabulada para enviarsela al algoritmo heurístico existente de abajo
                        const tabbedData = parsed.data.map(row => row.join('\t')).join('\n');
                        importExcelData.value = tabbedData;
                        // Forzamos el trigger del evento 'input' para que se autoevalue
                        const event = new Event('input', { bubbles: true });
                        importExcelData.dispatchEvent(event);

                        Swal.fire({
                            toast: true,
                            position: 'top-end',
                            icon: 'success',
                            title: '¡Sincronización leída con éxito!',
                            showConfirmButton: false,
                            timer: 2000
                        });
                    } else {
                        Swal.fire('Error', 'El archivo no contiene datos legibles o la pestaña está vacía.', 'error');
                    }
                } else {
                    // Fallback ingenuo si papa parse fallase por CDN blocker
                    const rows = csvText.split(/\r?\n/).filter(r => r.trim() !== '');
                    const tabbedData = rows.map(r => r.split(',').join('\t')).join('\n'); // Fallback super ingenuo pero funcional a prueba de fallos
                    importExcelData.value = tabbedData;
                    const event = new Event('input', { bubbles: true });
                    importExcelData.dispatchEvent(event);
                }

            } catch (error) {
                console.error("Error cargando CSV:", error);
                Swal.fire({
                    title: 'Error de Acceso',
                    html: `<p>No se pudo descargar la información.</p><p><small style="color:red">Asegúrate de que en el botón azul "Compartir" de Google Sheets hayas seleccionado <b>"Cualquier Persona con el Enlace (Lector)"</b>.</small></p>`,
                    icon: 'error'
                });
            } finally {
                btnSyncUrl.innerHTML = originalText;
                btnSyncUrl.disabled = false;
            }
        });
    }

    if (importExcelData) {
        importExcelData.addEventListener('input', async () => {
            const pastedText = importExcelData.value.trim();
            if (!pastedText) {
                importPreview.classList.add('hidden');
                btnProcessImport.disabled = true;
                return;
            }

            // Las filas pueden separarse por enter (\n)
            const rows = pastedText.split(/\r?\n/).filter(r => r.trim() !== '');
            if (rows.length === 0) {
                btnProcessImport.disabled = true;
                return;
            }

            parsedImportEventData = [];
            let validCount = 0;
            let previewHTML = '';

            rows.forEach((rowData, index) => {
                // Soportar delimitador de Tab (\t) (delimitador por defecto al copiar desde sheets) o Pipeline (|) usado por el usuario en el requerimiento.
                const cols = rowData.split('\t').length > rowData.split('|').length ? rowData.split('\t') : rowData.split('|');

                // Si la fila no tiene al menos la mínima cantidad de columnas (ej. 10 para llegar al ID), se saltea o marca inválida
                if (cols.length < 10) {
                    previewHTML += `<p style="color: #f87171; grid-column: 1 / -1; font-size: 0.8rem;"><i class="ph ph-warning"></i> Fila ${index + 1}: Faltan columnas (detectadas ${cols.length}). Revisa el formato.</p>`;
                    return;
                }

                try {
                    // Mapeo Basado en requerimiento
                    // 0: Mes
                    // 1: Inicio
                    // 2: Fin
                    // 3: Hora
                    // 4: Tipo
                    // 5: Actividad
                    // 6: Descripción
                    // 7: Responsable / Ponente (Depende de cómo se estructure, usamos lo copiado, pero el user dijo Ponente y luego área)
                    // Evaluando estructura del USER:
                    // 0: Mes (FEBRERO)
                    // 1: Inicio (12/02/2026)
                    // 2: Fin (12/02/2026)
                    // 3: Hora (5:30 p. m.)
                    // 4: Tipo de Evento (Webinar)
                    // 5: Actividad / Evento (Declaración Jurada...)
                    // 6: Descripción (Webinar a cargo del docente PTD Juan Carlos Costilla...)
                    // 7: Responsable(s) (Juan Costilla)
                    // 8: Vertical/Área (Finanzas)
                    // 9: Público Objetivo (Estudiantes / Egresados)
                    // 10: Público Detalle (Estudiantes y egresados COT)
                    // 11: Modalidad (Virtual )
                    // 12: Sede (Todas las sedes virtuales)
                    // 13: Creador/Responsable general (José)
                    // 14: Estado (7/7 Concluido)
                    // 15: ID (2FEB-W)

                    // IMPLEMENTACIÓN HEURÍSTICA DE COLUMNAS PARA EVITAR DESFASES POR CELDAS VACÍAS (PIPES | )
                    let inicioStr = '', finStr = '', horaStr = '', titulo = 'Desconocido', descripcion = '';
                    let vertical = '', publico = '', modalidadStr = 'Virtual', sedeDesc = 'Todas', responsableBase = '', sheetId = '';

                    let ptr = 1;
                    if (cols[ptr] && typeof cols[ptr] === 'string' && (cols[ptr].match(/\d{1,2}\/\d{1,2}\/\d{2,4}/) || cols[ptr].includes('-'))) inicioStr = cols[ptr++].trim();
                    if (cols[ptr] && typeof cols[ptr] === 'string' && (cols[ptr].match(/\d{1,2}\/\d{1,2}\/\d{2,4}/) || cols[ptr].includes('-'))) finStr = cols[ptr++].trim();
                    // Hora o am/pm o ':' (ej. 3:00, 15:00, 3 am)
                    if (cols[ptr] && typeof cols[ptr] === 'string' && cols[ptr].match(/(?:[0-2]?[0-9]:[0-5][0-9])|(?:a\.?\s*m\.?|p\.?\s*m\.?)/i)) horaStr = cols[ptr++].trim();

                    let ePtr = cols.length - 1;

                    // 1. Encontrar el sheet ID leyendo desde el final buscando patrón alfanumérico corto o con guión (Ej. 6MAR, 17FEB-W)
                    if (cols[ePtr] && cols[ePtr].length <= 10 && !cols[ePtr].toLowerCase().includes('conclu') && !cols[ePtr].toLowerCase().includes('proyec')) {
                        sheetId = cols[ePtr--].trim();
                    } else if (cols[ePtr] && (cols[ePtr].toLowerCase().includes('conclu') || cols[ePtr].toLowerCase().includes('proyec'))) {
                        // ID ignorado u omitido en la copiada
                    } else {
                        // Búsqueda profunda de ID
                        for (let i = cols.length - 1; i >= Math.max(0, cols.length - 4); i--) {
                            const c = cols[i]?.trim();
                            if (c && c.length <= 12 && (c.includes('-') || (/\d/.test(c) && /[a-zA-Z]/.test(c))) && !c.includes('/')) {
                                sheetId = c;
                                ePtr = i - 1;
                                break;
                            }
                        }
                    }

                    if (!sheetId) {
                        previewHTML += `<p style="color: #f87171; grid-column: 1 / -1; font-size: 0.8rem;"><i class="ph ph-warning"></i> Fila ${index + 1}: No se pudo detectar el código ID en esta fila.</p>`;
                        return;
                    }

                    // 2. Saltar la columna de Estado si está
                    if (ePtr >= 0 && cols[ePtr] && (cols[ePtr].toLowerCase().includes('conclu') || cols[ePtr].toLowerCase().includes('proyec') || cols[ePtr].toLowerCase().includes('difund') || cols[ePtr].match(/^\d\/\d/))) {
                        ePtr--;
                    }

                    // 3. Encontrar y anclarnos en la columna "Modalidad" (Virtual/Presencial/Hibrido) navegando hacia atrás
                    let modIdx = -1;
                    for (let i = ePtr; i >= ptr; i--) {
                        let cLow = (cols[i] || '').trim().toLowerCase();
                        if (cLow === 'virtual' || cLow === 'presencial' || cLow === 'hibrido' || cLow === 'híbrido' || cLow.startsWith('virtual')) {
                            modalidadStr = cols[i].trim();
                            modIdx = i;
                            break;
                        }
                    }

                    let vIdx = -1;
                    if (modIdx !== -1) {
                        // Si encontramos modalidad, lo que está a la derecha es sede y responsable
                        if (modIdx + 1 <= ePtr) sedeDesc = cols[modIdx + 1].trim();
                        if (modIdx + 2 <= ePtr) responsableBase = cols[modIdx + 2].trim();

                        // Lo que está a la izquierda es Público y Vertical
                        if (modIdx - 1 >= ptr) publico = cols[modIdx - 1].trim();
                        if (modIdx - 2 >= ptr) {
                            vertical = cols[modIdx - 2].trim();
                            vIdx = modIdx - 2;
                        }
                    } else {
                        // Respaldo de emergencia si no hay texto de modalidad explícito (poco probable en este proyecto)
                        vIdx = Math.max(ptr, ePtr - 4);
                    }

                    // Todo lo que quede desde 'ptr' (después de las fechas/hora) hasta 'vIdx' (antes de la vertical) es el TITULO y DESCRIPCIÓN
                    const endTitulo = vIdx !== -1 ? vIdx : ePtr + 1;
                    const remaining = [];
                    for (let i = ptr; i < endTitulo; i++) {
                        if (cols[i] && cols[i].trim()) remaining.push(cols[i].trim());
                    }

                    if (remaining.length > 0) titulo = remaining[0];
                    if (remaining.length > 1) descripcion = remaining.slice(1).join(' | ');

                    // Inferir Tipo de Evento en el "campo 5" (Descripción) o en el Título "campo 4"
                    let tipo = 'Curso';
                    const textoBuscqueda = (titulo + ' ' + descripcion).toLowerCase();
                    if (textoBuscqueda.includes('taller')) tipo = 'Taller';
                    else if (textoBuscqueda.includes('webinar')) tipo = 'Webinar';
                    else if (textoBuscqueda.includes('capacitacion') || textoBuscqueda.includes('capacitación')) tipo = 'Capacitación';
                    else if (textoBuscqueda.includes('kick off')) tipo = 'Kick Off Académico';

                    // Inferir Ponente de la descripción
                    let ponente = 'Pendiente';
                    const expPonente = descripcion.match(/(?:docente|ponente)\s+(?:PTD\s+|PTC\s+)?([A-ZÁÉÍÓÚÑa-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑa-záéíóúñ]+)*)/i);
                    if (expPonente && expPonente[1]) {
                        ponente = expPonente[1].split(' dirigido a ')[0].trim();
                    } else if (descripcion.includes(' a cargo de ')) {
                        ponente = descripcion.split(' a cargo de ')[1]?.split(' dirigido a ')[0]?.replace(/PTD\s+|PTC\s+/ig, '').trim() || ponente;
                    } else if (descripcion.includes(' a cargo del docente ')) {
                        ponente = descripcion.split(' a cargo del docente ')[1]?.split(' dirigido a ')[0]?.replace(/PTD\s+|PTC\s+/ig, '').trim() || ponente;
                    }

                    // Inferir Público
                    let finalAudiencia = publico;
                    const pubLower = publico.toLowerCase();
                    let ciclos = [];

                    if (pubLower.includes('estudiante') && (!pubLower.includes('ciclo') && !pubLower.match(/1er|2do|3er|4to|5to|6to| i | ii | iii | iv | v | vi/g))) {
                        // Si dice estudiantes y no especifica, todos los ciclos
                        ciclos = ['1', '2', '3', '4', '5', '6+'];
                    } else {
                        // Inferir por menciones
                        if (pubLower.match(/1er| i\b/)) ciclos.push('1');
                        if (pubLower.match(/2do| ii\b/)) ciclos.push('2');
                        if (pubLower.match(/3er| iii\b/)) ciclos.push('3');
                        if (pubLower.match(/4to| iv\b/)) ciclos.push('4');
                        if (pubLower.match(/5to| v\b/)) ciclos.push('5');
                        if (pubLower.match(/6to| vi\b/)) ciclos.push('6+');
                    }
                    if (pubLower.includes('egresado')) ciclos.push('Egresados');
                    if (pubLower.includes('docente')) ciclos.push('Docentes');
                    if (pubLower.includes('carrera') || pubLower.includes('publico') || pubLower.includes('público')) ciclos.push('Publico');

                    if (ciclos.length > 0) {
                        finalAudiencia = `${publico} (${[...new Set(ciclos)].join(', ')})`;
                    }

                    // Normalizar Modalidad
                    let modalidad = 'Virtual';
                    if (modalidadStr.toLowerCase().includes('presencial')) modalidad = 'Presencial';
                    else if (modalidadStr.toLowerCase().includes('hibrid') || modalidadStr.toLowerCase().includes('híbrid')) modalidad = 'Hibrido';

                    // Normalizar Fechas
                    let fechaFormateadaIni = '';
                    let fechaFormateadaFin = '';

                    const formatFecha = (fStr) => {
                        if (!fStr) return '';
                        let parts = fStr.split('/');
                        if (parts.length === 3) {
                            let d = parts[0].trim().padStart(2, '0');
                            let m = parts[1].trim().padStart(2, '0');
                            let y = parts[2].trim();
                            if (y.length === 2) y = '20' + y;
                            return `${y}-${m}-${d}`;
                        }
                        return '';
                    };

                    fechaFormateadaIni = formatFecha(inicioStr);
                    fechaFormateadaFin = formatFecha(finStr) || fechaFormateadaIni;

                    // Normalizar Horas
                    let horaFormatoIni = '00:00';
                    let horaFormatoFin = '23:59';
                    if (horaStr) {
                        const hm = horaStr.toLowerCase().match(/(\d+):(\d+)(?:\s*)(a\.?\s*m\.?|am|p\.?\s*m\.?|pm)?/);
                        if (hm) {
                            let h = parseInt(hm[1]);
                            let m = hm[2];
                            let isPm = hm[3] && (hm[3].includes('p') || hm[3].includes('pm'));
                            if (isPm && h < 12) h += 12;
                            if (!isPm && h === 12) h = 0;

                            horaFormatoIni = `${h.toString().padStart(2, '0')}:${m}`;
                            horaFormatoFin = `${((h + 2) % 24).toString().padStart(2, '0')}:${m}`; // Suma 2 hrs aprox por defecto
                        }
                    }

                    const horarioGenerado = [{
                        fecha: fechaFormateadaIni, // El esquema actual solo soporta una fecha inicio si no son repeticiones múltiples
                        inicio: horaFormatoIni,
                        fin: horaFormatoFin
                    }];

                    // Sedes
                    let sedesFinales = 'Todas';
                    if (modalidad !== 'Virtual') {
                        if (sedeDesc.toLowerCase().includes('arequipa') || sedeDesc.includes('AQP')) sedesFinales = 'AQP';
                        else if (sedeDesc.toLowerCase().includes('surco') || sedeDesc.includes('PRC')) sedesFinales = 'PRC';
                        else sedesFinales = sedeDesc.substring(0, 15); // Fallback
                    }

                    // Objeto UPSERT
                    parsedImportEventData.push({
                        sheet_id: sheetId,
                        tipo: tipo,
                        nombre: titulo,
                        ponente: ponente,
                        responsable: responsableBase || ponente, // Fallback si no hay responsable explícito
                        descripcion_evento: descripcion,
                        modalidad: modalidad,
                        sedes: sedesFinales,
                        horario: JSON.stringify(horarioGenerado),
                        audiencia: finalAudiencia
                        // Notice: Status is intentionally not updated if event exists (or set below for new)
                    });

                    // Añadir Info al Preview
                    if (validCount < 3) { // Solo mostrar previo de máximo 3 eventos para no saturar
                        previewHTML += `
                          <div style="grid-column: 1/-1; background: rgba(59, 130, 246, 0.1); padding: 5px; border-left: 3px solid #3b82f6; margin-bottom: 5px;">
                            <strong>${sheetId}:</strong> ${titulo} (${fechaFormateadaIni} ${horaFormatoIni}) <br>
                            <span style="font-size:0.75rem; color:#94a3b8;">Ponente: ${ponente} | Resp: ${responsableBase} | Mod: ${modalidad}</span>
                          </div>
                        `;
                    }
                    validCount++;

                } catch (e) {
                    console.error("Error interpretando fila ", index, e);
                }
            });

            if (validCount > 0 || previewHTML.trim() !== '') {
                importPreview.classList.remove('hidden');
                importPreviewContent.innerHTML = `<div style="grid-column: 1/-1; text-align:center;"><i class="ph ph-spinner ph-spin"></i> Analizando base de datos local y consolidando...</div>`;
                btnProcessImport.disabled = true;

                try {
                    const checkIds = parsedImportEventData.map(e => e.sheet_id);
                    const { data: preExist } = await supabase.from('eventos').select('sheet_id').in('sheet_id', checkIds);
                    const extSet = new Set((preExist || []).map(r => r.sheet_id));
                    let countExis = 0; let countNuevos = 0;
                    parsedImportEventData.forEach(e => {
                        if (extSet.has(e.sheet_id)) countExis++; else countNuevos++;
                    });

                    let countHeader = `<div style="grid-column: 1/-1; background:#0f172a; padding:10px; border-radius:8px; border-bottom: 3px solid #3b82f6;">
                                        <h4 style="margin-bottom:5px; color:white;">Pre-visualización de ${validCount} eventos procesables</h4>
                                        <p style="margin:0; font-size:0.8rem;"><span style="color:#22c55e; margin-right:8px;"><i class="ph ph-check-circle"></i> ${countNuevos} Nuevos</span> <span style="color:#eab308;"><i class="ph ph-arrows-clockwise"></i> ${countExis} Por Actualizar</span></p>
                                       </div>`;

                    if (validCount > 3) {
                        previewHTML += `<div style="grid-column: 1/-1; text-align: center; color: #cbd5e1; font-size: 0.8rem;">...y ${validCount - 3} eventos más.</div>`;
                    }
                    importPreviewContent.innerHTML = countHeader + previewHTML;
                    btnProcessImport.disabled = validCount === 0;
                } catch (e) {
                    console.error("Error validando localmente: ", e);
                    if (validCount > 3) previewHTML += `<div style="grid-column: 1/-1; text-align: center; color: #cbd5e1; font-size: 0.8rem;">...y ${validCount - 3} eventos más.</div>`;
                    importPreviewContent.innerHTML = previewHTML;
                    btnProcessImport.disabled = validCount === 0;
                }
            } else {
                importPreview.classList.add('hidden');
                btnProcessImport.disabled = true;
            }

        });
    }

    if (btnProcessImport) {
        btnProcessImport.addEventListener('click', async () => {
            if (!parsedImportEventData || parsedImportEventData.length === 0) return;

            const btn = btnProcessImport;
            const textOrig = btn.innerHTML;
            btn.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Sincronizando...';
            btn.disabled = true;

            try {
                // AUTO-INDEXAR PONENTES 
                const ponentesDetectadosMap = new Map();
                parsedImportEventData.forEach(e => {
                    if (e.ponente && e.ponente !== 'Pendiente') {
                        // Determinar tipo_docente revisando la descripción del evento
                        const isDocente = e.descripcion_evento.toLowerCase().includes('docente') || e.descripcion_evento.toLowerCase().includes('ponente');
                        ponentesDetectadosMap.set(e.ponente.trim(), isDocente ? 'Docente' : 'Externo');
                    }
                });

                const ponentesDetectados = Array.from(ponentesDetectadosMap.keys());

                if (ponentesDetectados.length > 0) {
                    const { data: dbPonentes, error: errPon } = await supabase.from('ponentes').select('nombres, apellidos');
                    if (!errPon && dbPonentes) {
                        const existingNames = dbPonentes.map(p => `${p.nombres} ${p.apellidos}`.trim().toLowerCase());
                        const ponentesNuevos = [];

                        ponentesDetectados.forEach(pDesc => {
                            if (!existingNames.some(en => pDesc.toLowerCase().includes(en) || en.includes(pDesc.toLowerCase()))) {
                                ponentesNuevos.push({
                                    nombres: pDesc,
                                    apellidos: '',
                                    tipo_docente: ponentesDetectadosMap.get(pDesc),
                                    especialidad: 'General'
                                });
                            }
                        });

                        if (ponentesNuevos.length > 0) {
                            console.log("Creando ponentes nuevos detectados:", ponentesNuevos);
                            await supabase.from('ponentes').insert(ponentesNuevos);
                        }
                    }
                }

                const sheetIdsToSync = parsedImportEventData.map(e => e.sheet_id);
                const { data: existingRecords, error: fetchErr } = await supabase
                    .from('eventos')
                    .select('*')
                    .in('sheet_id', sheetIdsToSync);

                if (fetchErr) throw fetchErr;

                const existingMap = new Map();
                existingRecords.forEach(r => existingMap.set(r.sheet_id, r));

                for (const ev of parsedImportEventData) {
                    // ELIMINAR PROPIEDAD ID (si existe) PARA EVITAR HETEROGENEOUS ARRAY BUG EN SUPABASE UPSERT 
                    delete ev.id;

                    const existing = existingMap.get(ev.sheet_id);
                    if (existing) {
                        // Respetar su status o colocar default 0 (sin alterar ID)
                        ev.status = existing.status || 0;
                        ev.estado_especial = existing.estado_especial || null;
                        ev.sustento = existing.sustento || null;

                        // MERGE FUERTE: Si la DB ya tiene info y el Sheets dice cosas vacías, respetar DB.
                        if ((!ev.ponente || ev.ponente === 'Pendiente') && existing.ponente) {
                            ev.ponente = existing.ponente;
                        }
                        if ((!ev.responsable || ev.responsable === 'Desconocido' || ev.responsable === 'Pendiente') && existing.responsable) {
                            ev.responsable = existing.responsable;
                        }
                        if (!ev.audiencia && existing.audiencia) {
                            ev.audiencia = existing.audiencia;
                        }
                        if (!ev.descripcion_evento && existing.descripcion_evento) {
                            ev.descripcion_evento = existing.descripcion_evento;
                        }

                        // Validar merge de horarios (si Sheets mandó horario dummy como 00:00 - 23:59 y DB sí tiene algo util)
                        if (ev.horario && existing.horario) {
                            try {
                                const ph = JSON.parse(ev.horario);
                                if (ph.length === 1 && ph[0].inicio === '00:00' && ph[0].fin === '23:59') {
                                    ev.horario = existing.horario; // Restaurar el valido local
                                }
                            } catch (e) { }
                        }
                    } else {
                        ev.status = 0; // New event starts at 0
                    }
                }

                const { error: upsertError } = await supabase
                    .from('eventos')
                    .upsert(parsedImportEventData, { onConflict: 'sheet_id' });

                if (upsertError) throw upsertError;

                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'success',
                    title: `¡${parsedImportEventData.length} eventos sincronizados con éxito!`,
                    showConfirmButton: false,
                    timer: 3000
                });

                importExcelModal.classList.remove('active');
                if (importExcelData) importExcelData.value = '';

                // Recarga tabla Dashboard
                loadEvents();

            } catch (e) {
                console.error("Error al sincronizar eventos: ", e);
                Swal.fire('Error de Sincronización', e.message, 'error');
            } finally {
                btn.innerHTML = textOrig;
                btn.disabled = false;
            }
        });
    }

});

// Close Modal on Outside Click
window.addEventListener('click', (e) => {
    const modal = document.getElementById('status-modal');
    if (e.target === modal) {
        modal.classList.remove('active');
    }
});

