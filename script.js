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

    // --- INITIALIZE SELECT2 AUTOCOMPLETE ---
    // Make sure it attaches correctly to the modal so the search input is clickable
    if ($.fn.select2) {
        $('#event-type').select2({
            placeholder: "Seleccione un tipo...",
            width: '100%',
            dropdownParent: $('#event-modal')
        });

        // Initialize Select2 on the dashboard filters
        $('#calendar-visibility-filter, #calendar-sede-filter').select2({
            width: '100%'
        });

        // The cert-event selector is outside a modal, on the main page
        $('#cert-event-selector').select2({
            placeholder: "Seleccione un evento...",
            width: '100%'
        });
    }

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
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtsbWptbGh3dXpoeW1ycGxlbWd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1OTMyNjQsImV4cCI6MjA4NzE2OTI2NH0.xFWMvUJa9n9TBcBG1WSeqCGiWBaCAtCU9aY7GXk4W6E';
    window.supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
    const supabase = window.supabaseClient;

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

        // Actualizar selector de eventos en la pestaña Generación
        const certEventSelector = document.getElementById('cert-event-selector');
        if (certEventSelector) {
            certEventSelector.innerHTML = '<option value="" disabled selected>Selecciona un evento...</option>';
            // Sort events by custom order or just date (newest first usually better for this)
            const sortedForSelect = [...events].reverse();
            sortedForSelect.forEach(ev => {
                if (ev.estado_especial === 'Cancelado') return; // no certs for cancelled

                let dateStr = "Sin fecha";
                try {
                    const hs = JSON.parse(ev.horario || '[]');
                    if (hs.length > 0 && hs[0].fecha) dateStr = hs[0].fecha;
                } catch (e) { }

                const opt = document.createElement('option');
                opt.value = ev.id;
                opt.textContent = `[${dateStr}] ${ev.nombre}`;
                certEventSelector.appendChild(opt);
            });
        }

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
        const detailMatch = audBase.match(/\(([^)]+)\)$/);
        if (detailMatch && detailMatch[1]) {
            detailText = detailMatch[1].trim();
            audBase = audBase.replace(/\([^)]+\)$/, '').trim();
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
            ponente: document.getElementById('event-ponente') ? document.getElementById('event-ponente').value : 'Pendiente',
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
            ponente: document.getElementById('event-ponente') ? document.getElementById('event-ponente').value.trim() : 'Pendiente',
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
        {
            id: 2,
            label: 'Formalizado',
            req: [
                { id: 'borrador_com', label: 'Borrador de Comunicación', type: 'action_draft' },
                { id: 'form_oficial', label: 'Llenar Formulario Oficial de Registro', type: 'action_link', target: 'https://docs.google.com/forms/d/e/1FAIpQLSew6aEIbaWAaYvjXYYY0gxqmAH0g6377nuOEx1Bx5su1j_M_A/viewform' },
                { id: 'check_form_registro', label: '¿Haz llenado el formulario oficial de registro?' },
                { id: 'check_correo_conf', label: '¿Has recibido la confirmación por correo de "Solicitudes de Comunicación CERTUS"?' }
            ]
        },
        {
            id: 3,
            label: 'Comunicado',
            req: [
                { id: 'prog_zoom_meet', label: '¿Has programado el evento en zoom o meet?', type: 'action_input_link', placeholder: 'Pega el link de la reunión aquí' },
                { id: 'solicitado_foto', label: '¿Haz solicitado la foto al ponente?' },
                { id: 'cargar_foto', label: 'Subir foto del ponente', type: 'action_upload_image' },
                { id: 'indicado_preparar', label: '¿Haz indicado al ponente que vaya preparando el evento?' }
            ]
        },
        {
            id: 4,
            label: 'Difundido',
            req: [
                { id: 'req_com_foto', label: '¿El área de comunicaciones te ha requerido por correo electronico la foto del ponente y le has enviado la foto?' },
                { id: 'descargar_foto', label: 'Descargar foto del ponente', type: 'action_download_image' },
                { id: 'marca_revision', label: '¿Marca te ha solicitado que revises el texto comunicacional y/o diseño de piezas publicitarias?' },
                { id: 'comunicado_delegados', label: '¿Haz comunicado a los delegados sobre el evento?' },
                { id: 'borrador_invitacion', label: 'Borrador de Invitación', type: 'action_draft_invite' }
            ]
        },
        {
            id: 5,
            label: 'Preparado',
            req: [
                { id: 'elaborado_material', label: '¿El ponente ha terminado de elaborar su material del evento?' },
                { id: 'cargar_material', label: 'Subir material del evento (Un día antes)', type: 'action_upload_file' },
                { id: 'compartido_recordatorio', label: '¿Haz compartido a los participantes del evento el recordatorio y/o link de reunión?' },
                { id: 'borrador_recordatorio', label: 'Generar Borrador de Recordatorio', type: 'action_draft_reminder' }
            ]
        },
        {
            id: 6,
            label: 'Realizado',
            req: [
                { id: 'evidencia_fotos', label: '¿Has tomado capturas de pantalla /fotos como evidencia?' },
                { id: 'compartido_asistencia', label: '¿Has compartido formulario de asistencia?' },
                { id: 'borrador_constancias', label: 'Generar Borrador de Constancias', type: 'action_draft_certificates' },
                { id: 'enviado_constancias', label: '¿Has enviado las constancias de participación?' },
                { id: 'culminado_total', label: '¿Has desarrollado y culminado el evento?' }
            ]
        },
        {
            id: 7,
            label: 'Concluido',
            req: '¡Evento finalizado con éxito! Todos los pasos han sido completados.'
        }
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

        // Status Badges (Calcular antes para usar nextStep)
        const currentStep = parseInt(eventData.status) || 0;
        const nextStep = currentStep + 1;

        // Populate Info
        let ponenteHtml = '';
        if ((!eventData.ponente || eventData.ponente.toLowerCase() === 'pendiente') && nextStep >= 2) {
            ponenteHtml = `
                <div style="margin-top: 1rem; padding: 0.5rem; background: rgba(245, 158, 11, 0.1); border-left: 3px solid #f59e0b; border-radius: 4px;">
                    <label style="color:var(--text-muted); font-size:0.85rem; font-weight: bold;">Asignar Ponente (Requerido para avanzar):</label>
                    <select id="status-ponente-input" class="input-modern" style="width:100%; margin-top:0.3rem;" required>
                        <!-- Se llenará clonando las opciones de BD -->
                    </select>
                </div>
            `;
        } else {
            ponenteHtml = `<p style="color:var(--text-muted); margin-top: 0.5rem;"><i class="ph ph-user"></i> Ponente: <strong style="color: #f8fafc;">${eventData.ponente}</strong></p>`;
        }
        infoDiv.innerHTML = `<h3>${eventData.nombre}</h3><p style="color:var(--text-muted)">${eventData.tipo} - ${eventData.modalidad}</p>${ponenteHtml}`;

        // Initialize Select2 array logic
        if ((!eventData.ponente || eventData.ponente.toLowerCase() === 'pendiente') && nextStep >= 2) {
            const selectTarget = document.getElementById('status-ponente-input');
            const selectSource = document.getElementById('event-ponente');

            if (selectTarget && selectSource) {
                // Clonar las opciones ya cargadas de la BD
                selectTarget.innerHTML = selectSource.innerHTML;

                // Inicializar Select2
                if ($.fn.select2) {
                    $('#status-ponente-input').select2({
                        placeholder: "Seleccione un ponente...",
                        width: '100%',
                        dropdownParent: $('#status-modal')
                    });
                }
            }
        }

        // Generar requerimientos dinámico
        reqList.innerHTML = '';
        btnAdvance.disabled = false; // Siempre activo para mostrar advertencia
        let isStepCompletable = false;

        // Determinar etiquetas de avance
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

            // --- REPORTE FINAL DEL EVENTO (Step 7) ---
            const reqContainer = document.querySelector('.status-requirements');
            const reqTitle = reqContainer ? reqContainer.querySelector('h4') : null;
            if (reqTitle) reqTitle.textContent = "Reporte Final del Evento";

            reqList.innerHTML = `<li style="padding: 2rem; text-align: center; color: #94a3b8;"><i class="ph ph-spinner ph-spin" style="font-size: 2rem;"></i><br>Cargando reporte de alumnos...</li>`;

            (async () => {
                try {
                    const { data: participants, error } = await window.supabaseClient
                        .from('participantes')
                        .select('dni, asistencia')
                        .eq('evento_id', eventData.id);

                    if (error) throw error;

                    const totalInscritos = participants.length;
                    const totalAsistentes = participants.filter(p => p.asistencia === true).length;
                    const porcentajeAsistencia = totalInscritos > 0 ? Math.round((totalAsistentes / totalInscritos) * 100) : 0;

                    reqList.innerHTML = `
                        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; padding: 1rem 0;">
                            <div style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.2); padding: 1.5rem 1rem; border-radius: 12px; text-align: center;">
                                <div style="font-size: 0.8rem; color: #94a3b8; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.05em;">Inscritos</div>
                                <div style="font-size: 2rem; font-weight: 800; color: #3b82f6;">${totalInscritos}</div>
                            </div>
                            <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); padding: 1.5rem 1rem; border-radius: 12px; text-align: center;">
                                <div style="font-size: 0.8rem; color: #94a3b8; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.05em;">Asistentes</div>
                                <div style="font-size: 2rem; font-weight: 800; color: #10b981;">${totalAsistentes}</div>
                            </div>
                            <div style="background: rgba(139, 92, 246, 0.1); border: 1px solid rgba(139, 92, 246, 0.2); padding: 1.5rem 1rem; border-radius: 12px; text-align: center;">
                                <div style="font-size: 0.8rem; color: #94a3b8; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.05em;">Asistencia %</div>
                                <div style="font-size: 2rem; font-weight: 800; color: #8b5cf6;">${porcentajeAsistencia}%</div>
                            </div>
                        </div>
                        <li style="padding: 1rem; color: #94a3b8; text-align: center; border: none; font-size: 0.9rem; line-height: 1.6;">
                            ¡Evento finalizado con éxito! Todos los pasos han sido completados y la data ha sido sincronizada.
                        </li>
                    `;
                } catch (e) {
                    console.error("Error al cargar reporte:", e);
                    reqList.innerHTML = `<li style="padding: 1rem; color: #ef4444; text-align: center;">Error al cargar la data de participantes.</li>`;
                }
            })();
        }

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
                        window.currentEventRequisitos = reqData;
                    } catch (e) { }

                    const evaluateAdvanceButton = () => {
                        let ok = true;
                        configForCurrent.req.forEach(r => {
                            if (r.type === 'action_input_link' || r.type === 'action_upload_image' || r.type === 'action_upload_file') {
                                if (r.id === 'prog_zoom_meet' && eventData.modalidad === 'Presencial') {
                                    // Optional for presencial
                                } else if (typeof reqData[r.id] !== 'string' || reqData[r.id].trim() === '') {
                                    ok = false;
                                }
                            } else if (r.type !== 'action_drive' && r.type !== 'action_draft' && r.type !== 'action_link' && r.type !== 'action_download_image' && r.type !== 'action_draft_invite' && r.type !== 'action_draft_reminder') {
                                // Default checkbox logic
                                if (reqData[r.id] !== true) ok = false;
                            } else if (r.type === 'action_drive') {
                                if (!reqData.folder_url && reqData[r.id] !== true) ok = false;
                            }
                        });

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

                        // --- SPECIAL LOGIC FOR ACTION_INPUT_LINK (Text Input + Save Button) ---
                        if (r.type === 'action_input_link') {
                            const savedValue = reqData[r.id];
                            const linkIsSaved = typeof savedValue === 'string' && savedValue.trim().length > 0;

                            li.innerHTML = `
                                <div style="flex:1; padding-right: 15px;">
                                    <label style="font-size: 0.95rem; color: #cbd5e1; user-select: none;">${r.label}</label>
                                    <div style="margin-top: 5px; display: flex; gap: 8px;">
                                        <input type="text" id="input-link-${r.id}" placeholder="${r.placeholder}" value="${linkIsSaved ? savedValue : ''}" style="flex: 1; padding: 0.4rem; border-radius: 4px; border: 1px solid #475569; background: #1e293b; color: white; font-size: 0.85rem; outline: none;">
                                        <button class="btn-secondary" id="btn-save-link-${r.id}" style="padding: 0.4rem 0.8rem; font-size: 0.85rem; border-radius: 4px; display:inline-flex; align-items:center; gap: 0.4rem;">
                                            <i class="ph ph-floppy-disk"></i> Guardar
                                        </button>
                                    </div>
                                </div>
                                <div style="display: flex; gap: 15px; align-items: center; user-select: none;">
                                    ${linkIsSaved ? '<span style="color: #22c55e; font-size: 1.5rem;"><i class="ph ph-check-circle"></i></span>' : '<span style="color: #64748b; font-size: 1.5rem;"><i class="ph ph-circle"></i></span>'}
                                </div>
                            `;
                            reqList.appendChild(li);

                            li.querySelector(`#btn-save-link-${r.id}`).addEventListener('click', async () => {
                                const inputVal = document.getElementById(`input-link-${r.id}`).value.trim();
                                if (!inputVal) {
                                    Swal.fire({ title: 'Aviso', text: 'Por favor, ingresa un enlace antes de guardar.', icon: 'warning', target: document.getElementById('status-modal') });
                                    return;
                                }

                                const btn = li.querySelector(`#btn-save-link-${r.id}`);
                                btn.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Guardando...';
                                btn.disabled = true;

                                reqData[r.id] = inputVal;
                                await updateReqsInDB(reqData);

                                // Refresh to show checkmark
                                window.openStatusModal(encodeURIComponent(JSON.stringify(eventData)));
                            });

                            // Evaluate completion: string length > 0
                            if (!linkIsSaved) isStepCompletable = false;

                            return;
                        }

                        // --- SPECIAL LOGIC FOR ACTION_UPLOAD_IMAGE (File Upload) ---
                        else if (r.type === 'action_upload_image') {
                            const isUploaded = reqData[r.id] === true || typeof reqData[r.id] === 'string'; // true if done, or url

                            li.innerHTML = `
                                <div style="flex:1; padding-right: 15px;">
                                    <label style="font-size: 0.95rem; color: #cbd5e1; user-select: none;">${r.label}</label>
                                </div>
                                <div style="display: flex; gap: 10px; align-items: center; user-select: none;">
                                    ${isUploaded ?
                                    `<span style="background: rgba(34, 197, 94, 0.2); color: #22c55e; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: bold; margin-right: 10px;">IMAGEN SUBIDA</span>`
                                    :
                                    `<input type="file" id="file-upload-${r.id}" accept="image/*" style="display: none;">
                                         <button class="btn-primary" onclick="document.getElementById('file-upload-${r.id}').click()" style="padding: 0.4rem 0.8rem; font-size: 0.85rem; border-radius: 6px; display:inline-flex; align-items:center; gap: 0.4rem;">
                                            <i class="ph ph-upload-simple"></i> Seleccionar
                                         </button>
                                         <button class="btn-secondary" id="btn-upload-${r.id}" style="display:none; padding: 0.4rem 0.8rem; font-size: 0.85rem; border-radius: 6px; align-items:center; gap: 0.4rem;">
                                            <i class="ph ph-cloud-arrow-up"></i> Guardar
                                         </button>`
                                }
                                </div>
                            `;
                            reqList.appendChild(li);

                            if (!isUploaded) {
                                const fileInput = document.getElementById(`file-upload-${r.id}`);
                                const btnSelect = li.querySelector('.btn-primary');
                                const btnUpload = document.getElementById(`btn-upload-${r.id}`);

                                fileInput.addEventListener('change', () => {
                                    if (fileInput.files.length > 0) {
                                        const file = fileInput.files[0];
                                        btnSelect.innerHTML = `<i class="ph ph-image"></i> ${file.name.substring(0, 15)}...`;
                                        btnSelect.style.background = '#475569';
                                        btnUpload.style.display = 'inline-flex';
                                    }
                                });

                                btnUpload.addEventListener('click', async () => {
                                    const file = fileInput.files[0];
                                    if (!file) return;

                                    btnUpload.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Subiendo...';
                                    btnUpload.disabled = true;
                                    btnSelect.style.display = 'none';

                                    try {
                                        const storedFolderUrl = (window.currentEventRequisitos && window.currentEventRequisitos.folder_url) || '';
                                        if (!storedFolderUrl) {
                                            Swal.fire({ title: 'Uy!', text: 'Falta la carpeta del evento. Retrocede a "Planificado" para crearla.', icon: 'warning', target: document.getElementById('status-modal') });
                                            btnUpload.innerHTML = '<i class="ph ph-cloud-arrow-up"></i> Guardar';
                                            btnUpload.disabled = false;
                                            btnSelect.style.display = 'inline-flex';
                                            return;
                                        }

                                        const reader = new FileReader();
                                        reader.onload = async function () {
                                            const base64Data = reader.result.split(',')[1];
                                            const response = await fetch(GOOGLE_APP_SCRIPT_WEBHOOK_URL, {
                                                method: 'POST', mode: 'cors',
                                                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                                                body: JSON.stringify({
                                                    action: 'subir_foto_ponente',
                                                    data: {
                                                        folder_url: storedFolderUrl,
                                                        file_name: file.name,
                                                        mime_type: file.type,
                                                        file_content: base64Data
                                                    }
                                                })
                                            });
                                            const result = await response.json();
                                            if (result.status === "ok") {
                                                reqData[r.id] = result.file_url || true;
                                                await updateReqsInDB(reqData);
                                                window.openStatusModal(encodeURIComponent(JSON.stringify(eventData)));
                                            } else {
                                                throw new Error("GAS Script response failed: " + result.message);
                                            }
                                        };
                                        reader.readAsDataURL(file);

                                    } catch (err) {
                                        console.error(err);
                                        Swal.fire('Error', 'Hubo un error subiendo la foto a Drive.', 'error');
                                        btnUpload.innerHTML = '<i class="ph ph-cloud-arrow-up"></i> Guardar';
                                        btnUpload.disabled = false;
                                        btnSelect.style.display = 'inline-flex';
                                    }
                                });

                                // Evaluate completion: string length > 0 or true
                                if (!isUploaded) isStepCompletable = false;
                            }

                            return;
                        }

                        // --- SPECIAL LOGIC FOR ACTION_DOWNLOAD_IMAGE ---
                        else if (r.type === 'action_download_image') {
                            const fotoUrl = window.currentEventRequisitos && window.currentEventRequisitos['cargar_foto'];
                            const isDisabled = typeof fotoUrl !== 'string' || !fotoUrl.startsWith('http');

                            li.innerHTML = `
                                <div style="flex:1; padding-right: 15px;">
                                    <label style="font-size: 0.95rem; color: #cbd5e1; user-select: none;">${r.label}</label>
                                </div>
                                <div style="display: flex; gap: 15px; align-items: center; user-select: none;">
                                    <button class="btn-primary" id="btn-dw-${r.id}" ${isDisabled ? 'disabled' : ''} style="padding: 0.4rem 0.8rem; font-size: 0.85rem; border-radius: 6px; display:inline-flex; align-items:center; gap: 0.4rem; ${isDisabled ? 'opacity: 0.5; cursor: not-allowed;' : ''}">
                                        <i class="ph ph-download-simple"></i> Ver / Descargar
                                    </button>
                                </div>
                            `;
                            reqList.appendChild(li);

                            if (!isDisabled) {
                                li.querySelector(`#btn-dw-${r.id}`).addEventListener('click', () => {
                                    window.open(fotoUrl, '_blank');
                                    reqData[r.id] = true;
                                    updateReqsInDB(reqData);
                                    window.openStatusModal(encodeURIComponent(JSON.stringify(eventData)));
                                });
                            }
                            // Solo es obligatorio si no se ha validado (se valida al hacer clic)
                            if (reqData[r.id] !== true) isStepCompletable = false;

                            return;
                        }

                        // --- SPECIAL LOGIC FOR ACTION_DRAFT_INVITE ---
                        else if (r.type === 'action_draft_invite') {
                            li.innerHTML = `
                                <div style="flex:1; padding-right: 15px;">
                                    <label style="font-size: 0.95rem; color: #cbd5e1; user-select: none;">${r.label}</label>
                                </div>
                                <div style="display: flex; gap: 15px; align-items: center; user-select: none;">
                                    <button class="btn-secondary" id="btn-dinv-${r.id}" style="padding: 0.4rem 0.8rem; font-size: 0.85rem; border-radius: 6px; display:inline-flex; align-items:center; gap: 0.4rem;">
                                        <i class="ph ph-envelope-simple-open"></i> Generar Invitación
                                    </button>
                                </div>
                            `;
                            reqList.appendChild(li);

                            li.querySelector(`#btn-dinv-${r.id}`).addEventListener('click', () => {
                                let formLinkTexto = "[Link no encontrado, actualiza la etapa 1]";
                                try {
                                    const reqObj = window.currentEventRequisitos || {};
                                    if (reqObj.form_inscripcion_url) {
                                        formLinkTexto = reqObj.form_inscripcion_url;
                                    }
                                } catch (e) { }

                                let fechasFormateadas = "[Fecha no disponible]";
                                try {
                                    const hStr = eventData.horario || '[]';
                                    const hrs = typeof hStr === 'string' ? JSON.parse(hStr) : hStr;
                                    const fechasArr = [];
                                    for (const h of hrs) {
                                        if (h.fecha) {
                                            const [yyyy, mm, dd] = h.fecha.split('-');
                                            let ft = `${dd}/${mm}/${yyyy}`;
                                            if (h.inicio && h.fin) ft += ` desde las ${h.inicio} hasta las ${h.fin}`;
                                            else if (h.inicio) ft += ` desde las ${h.inicio}`;
                                            fechasArr.push(ft);
                                        }
                                    }
                                    if (fechasArr.length > 0) fechasFormateadas = fechasArr.join(', ');
                                } catch (e) { }

                                const draftText = `Estimados delegados,\n\nLos invitamos cordialmente a participar y difundir el evento ${eventData.tipo}: "${eventData.nombre}" que se realizará en las fechas: ${fechasFormateadas}.\n\nPor favor, regístrense en el siguiente enlace de inscripción:\n${formLinkTexto}\n\n¡Los esperamos!`;

                                Swal.fire({
                                    title: 'Invitación para Delegados',
                                    html: `
                                        <textarea id="invite-draft-text" readonly style="width: 100%; height: 150px; padding: 10px; border-radius: 6px; border: 1px solid #cbd5e1; background: #f8fafc; color: #1e293b; font-size: 0.95rem; resize: none; outline: none; box-sizing: border-box;">${draftText}</textarea>
                                        <button onclick="navigator.clipboard.writeText(document.getElementById('invite-draft-text').value); Swal.fire('Copiado', 'Texto copiado al portapapeles', 'success');" class="btn-primary" style="margin-top: 15px; padding: 0.6rem 1.2rem; border-radius: 6px; display:inline-flex; align-items:center; gap: 0.4rem; cursor:pointer;">
                                            <i class="ph ph-copy"></i> Copiar Texto
                                        </button>
                                    `,
                                    showConfirmButton: false,
                                    showCloseButton: true,
                                    width: '600px',
                                    customClass: { popup: 'swal-dark-layout' }
                                });

                                reqData[r.id] = true;
                                updateReqsInDB(reqData);
                                window.openStatusModal(encodeURIComponent(JSON.stringify(eventData)));
                            });

                            // Se valida al hacer clic
                            if (reqData[r.id] !== true) isStepCompletable = false;

                            return;
                        }

                        // Soportar tres estados: true, false, y undefined
                        const val = reqData[r.id];

                        // --- SPECIAL LOGIC FOR ACTION_UPLOAD_FILE (Any File Upload) ---
                        if (r.type === 'action_upload_file') {
                            const isUploaded = reqData[r.id] === true || typeof reqData[r.id] === 'string'; // true if done, or url

                            li.innerHTML = `
                                <div style="flex:1; padding-right: 15px;">
                                    <label style="font-size: 0.95rem; color: #cbd5e1; user-select: none;">${r.label}</label>
                                </div>
                                <div style="display: flex; gap: 10px; align-items: center; user-select: none;">
                                    ${isUploaded ?
                                    `<span style="background: rgba(34, 197, 94, 0.2); color: #22c55e; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: bold; margin-right: 10px;">ARCHIVO SUBIDO</span>`
                                    :
                                    `<input type="file" id="file-upload-${r.id}" accept="*" style="display: none;">
                                         <button class="btn-primary" onclick="document.getElementById('file-upload-${r.id}').click()" style="padding: 0.4rem 0.8rem; font-size: 0.85rem; border-radius: 6px; display:inline-flex; align-items:center; gap: 0.4rem;">
                                            <i class="ph ph-upload-simple"></i> Seleccionar
                                         </button>
                                         <button class="btn-secondary" id="btn-upload-${r.id}" style="display:none; padding: 0.4rem 0.8rem; font-size: 0.85rem; border-radius: 6px; align-items:center; gap: 0.4rem;">
                                            <i class="ph ph-cloud-arrow-up"></i> Guardar
                                         </button>`
                                }
                                </div>
                            `;
                            reqList.appendChild(li);

                            if (!isUploaded) {
                                const fileInput = document.getElementById(`file-upload-${r.id}`);
                                const btnSelect = li.querySelector('.btn-primary');
                                const btnUpload = document.getElementById(`btn-upload-${r.id}`);

                                fileInput.addEventListener('change', () => {
                                    if (fileInput.files.length > 0) {
                                        const file = fileInput.files[0];
                                        btnSelect.innerHTML = `<i class="ph ph-file"></i> ${file.name.substring(0, 15)}...`;
                                        btnSelect.style.background = '#475569';
                                        btnUpload.style.display = 'inline-flex';
                                    }
                                });

                                btnUpload.addEventListener('click', async () => {
                                    const file = fileInput.files[0];
                                    if (!file) return;

                                    btnUpload.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Subiendo...';
                                    btnUpload.disabled = true;
                                    btnSelect.style.display = 'none';

                                    try {
                                        const storedFolderUrl = (window.currentEventRequisitos && window.currentEventRequisitos.folder_url) || '';
                                        if (!storedFolderUrl) {
                                            Swal.fire({ title: 'Uy!', text: 'Falta la carpeta del evento.', icon: 'warning', target: document.getElementById('status-modal') });
                                            btnUpload.innerHTML = '<i class="ph ph-cloud-arrow-up"></i> Guardar';
                                            btnUpload.disabled = false;
                                            btnSelect.style.display = 'inline-flex';
                                            return;
                                        }

                                        const reader = new FileReader();
                                        reader.onload = async function () {
                                            const base64Data = reader.result.split(',')[1];
                                            const response = await fetch(GOOGLE_APP_SCRIPT_WEBHOOK_URL, {
                                                method: 'POST', mode: 'cors',
                                                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                                                body: JSON.stringify({
                                                    action: 'subir_foto_ponente', // Re-using GAS upload handler
                                                    data: {
                                                        folder_url: storedFolderUrl,
                                                        file_name: file.name,
                                                        mime_type: file.type,
                                                        file_content: base64Data
                                                    }
                                                })
                                            });
                                            const result = await response.json();
                                            if (result.status === "ok") {
                                                reqData[r.id] = result.file_url || true;
                                                await updateReqsInDB(reqData);
                                                window.openStatusModal(encodeURIComponent(JSON.stringify(eventData)));
                                            } else {
                                                throw new Error("GAS Script response failed");
                                            }
                                        };
                                        reader.readAsDataURL(file);
                                    } catch (err) {
                                        Swal.fire('Error', 'Hubo un error subiendo el archivo.', 'error');
                                        btnUpload.innerHTML = '<i class="ph ph-cloud-arrow-up"></i> Guardar';
                                        btnUpload.disabled = false;
                                        btnSelect.style.display = 'inline-flex';
                                    }
                                });

                                if (!isUploaded) isStepCompletable = false;
                            }
                            return;
                        }

                        // --- SPECIAL LOGIC FOR ACTION_DRAFT_CERTIFICATES ---
                        else if (r.type === 'action_draft_certificates') {
                            li.innerHTML = `
                                <div style="flex:1; padding-right: 15px;">
                                    <label style="font-size: 0.95rem; color: #cbd5e1; user-select: none;">${r.label}</label>
                                </div>
                                <div style="display: flex; gap: 15px; align-items: center; user-select: none;">
                                    <button class="btn-secondary" id="btn-cert-${r.id}" style="padding: 0.4rem 0.8rem; font-size: 0.85rem; border-radius: 6px; display:inline-flex; align-items:center; gap: 0.4rem;">
                                        <i class="ph ph-certificate"></i> Generar Borrador
                                    </button>
                                </div>
                            `;
                            reqList.appendChild(li);

                            li.querySelector(`#btn-cert-${r.id}`).addEventListener('click', async (e) => {
                                const btn = e.currentTarget;
                                const originalHtml = btn.innerHTML;
                                btn.disabled = true;
                                btn.innerHTML = `<i class="ph ph-spinner ph-spin"></i> Sincronizando...`;

                                try {
                                    const reqObj = window.currentEventRequisitos || {};
                                    // Para constancias, necesitamos el enlace de asistencia (usualmente guardado en reqData.asistencia_form_url o similar si el usuario lo puso)
                                    // Pero el usuario dijo "como cuando presionabas generar borrador en fase 5", así que buscaremos el sheet de respuestas.

                                    // 1. Obtener respuestas del formulario de ASISTENCIA (no de inscripción)
                                    if (!reqData.responses_sheet_asistencia_url) {
                                        console.log("Iniciando búsqueda automática de asistencia en folder:", reqObj.folder_url);
                                        // Intentar búsqueda AUTOMÁTICA primero si hay folder_url
                                        let foundUrl = "";
                                        if (reqObj.folder_url) {
                                            try {
                                                const gasSearch = await fetch(GOOGLE_APP_SCRIPT_WEBHOOK_URL, {
                                                    method: 'POST', mode: 'cors',
                                                    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                                                    body: JSON.stringify({
                                                        action: 'vincular_y_obtener_respuestas',
                                                        data: {
                                                            folder_url: reqObj.folder_url,
                                                            form_type: 'ASISTENCIA'
                                                        }
                                                    })
                                                });
                                                const searchResult = await gasSearch.json();
                                                console.log("GAS Search Result:", searchResult);

                                                if (searchResult.status === "ok" && searchResult.spreadsheet_url) {
                                                    reqData.responses_sheet_asistencia_url = searchResult.spreadsheet_url;
                                                    reqData.asistencia_responses = searchResult.responses || [];
                                                    await updateReqsInDB(reqData);
                                                    foundUrl = searchResult.spreadsheet_url;
                                                    console.log("Búsqueda automática exitosa:", foundUrl);
                                                }
                                            } catch (searchErr) {
                                                console.warn("Error en búsqueda automática:", searchErr);
                                            }
                                        }

                                        // Si falló la búsqueda automática (o no hay folder_url), pedir manual (Backup)
                                        if (!foundUrl) {
                                            console.log("Búsqueda automática falló, solicitando URL manual");
                                            const { value: url } = await Swal.fire({
                                                title: 'Enlace de Asistencia',
                                                text: 'No pudimos encontrar el formulario de asistencia automáticamente. Por favor, realiza lo siguiente:\n1. Abre el formulario de asistencia en Google Forms.\n2. Ve a la pestaña "Respuestas" y haz clic en "Vincular con Hojas de cálculo".\n3. Pega aquí el enlace de esa hoja generada.',
                                                input: 'url',
                                                inputPlaceholder: 'https://docs.google.com/spreadsheets/d/...',
                                                showCancelButton: true
                                            });

                                            if (!url) throw new Error("Se requiere el enlace de asistencia para continuar.");

                                            const gasResponse = await fetch(GOOGLE_APP_SCRIPT_WEBHOOK_URL, {
                                                method: 'POST', mode: 'cors',
                                                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                                                body: JSON.stringify({
                                                    action: 'vincular_y_obtener_respuestas',
                                                    data: { form_url: url }
                                                })
                                            });
                                            const result = await gasResponse.json();
                                            if (result.status === "ok") {
                                                reqData.responses_sheet_asistencia_url = result.spreadsheet_url;
                                                reqData.asistencia_responses = result.responses || [];
                                                await updateReqsInDB(reqData);
                                            } else throw new Error(result.message || "Error en GAS");
                                        }
                                    }

                                    // 2. Sincronización Inteligente
                                    const { data: dbParticipants } = await window.supabaseClient
                                        .from('participantes')
                                        .select('*')
                                        .eq('evento_id', eventData.id);

                                    const asistenciaRows = reqData.asistencia_responses || [];
                                    const toUpsert = [];

                                    const findVal = (row, possibleKeys) => {
                                        const key = Object.keys(row).find(k =>
                                            possibleKeys.some(pk => k.toLowerCase().replace(/\s/g, '').includes(pk.toLowerCase().replace(/\s/g, '')))
                                        );
                                        return key ? row[key] : null;
                                    };

                                    asistenciaRows.forEach(row => {
                                        const dni = (row['DNI:'] || row['DNI'] || findVal(row, ['DNI']) || '').toString().trim();
                                        const correo = (row['Correo electrónico'] || row['Correo'] || findVal(row, ['Correo']) || '').toString().trim().toLowerCase();
                                        const apellidosNuevos = (row['Apellidos:'] || row['Apellidos'] || findVal(row, ['Apellido']) || '').toString().trim();
                                        const nombresNuevos = (row['Nombres:'] || row['Nombres'] || findVal(row, ['Nombre']) || '').toString().trim();
                                        let nombreCompleto = "";

                                        if (apellidosNuevos || nombresNuevos) {
                                            nombreCompleto = (apellidosNuevos + " " + nombresNuevos).trim();
                                        } else {
                                            nombreCompleto = (row['Apellidos y Nombres completos:'] || row['Apellidos y Nombres completos'] || row['Nombres y Apellidos'] || '').toString().trim();
                                        }

                                        if (!dni && !correo && !nombreCompleto) return;

                                        // Buscar en DB si ya existe
                                        let existing = dbParticipants.find(p => {
                                            const matchDni = dni && p.dni && p.dni.toString().trim() === dni;
                                            const matchCorreo = correo && p.correo && p.correo.toLowerCase().trim() === correo;

                                            const pFull = (p.nombres + ' ' + (p.apellidos || '')).toLowerCase().trim();
                                            const rowFull = nombreCompleto.toLowerCase().trim();
                                            const matchNombre = nombreCompleto && (pFull.includes(rowFull) || rowFull.includes(pFull));

                                            return matchDni || matchCorreo || matchNombre;
                                        });

                                        if (existing) {
                                            toUpsert.push({
                                                ...existing,
                                                asistencia: true,
                                                certificado_autorizado: true
                                            });
                                        } else {
                                            // Si no existe, crear nuevo
                                            toUpsert.push({
                                                evento_id: eventData.id,
                                                dni: dni || 'N/A',
                                                nombres: nombreCompleto,
                                                correo: correo,
                                                asistencia: true,
                                                certificado_autorizado: true
                                            });
                                        }
                                    });

                                    if (toUpsert.length > 0) {
                                        await window.supabaseClient
                                            .from('participantes')
                                            .upsert(toUpsert, { onConflict: 'dni, evento_id' });
                                    }

                                    // 3. Abrir Modal de Borrador de Constancias
                                    window.openCertificatesDraftModal(eventData, reqData);

                                    // Marcar como completado
                                    reqData[r.id] = true;
                                    await updateReqsInDB(reqData);
                                    window.openStatusModal(encodeURIComponent(JSON.stringify(eventData)));

                                } catch (error) {
                                    console.error(error);
                                    Swal.fire('Error', error.message, 'error');
                                } finally {
                                    btn.disabled = false;
                                    btn.innerHTML = originalHtml;
                                }
                            });

                            if (reqData[r.id] !== true) isStepCompletable = false;
                            return;
                        }

                        // --- SPECIAL LOGIC FOR ACTION_DRAFT_REMINDER ---
                        else if (r.type === 'action_draft_reminder') {
                            li.innerHTML = `
                                <div style="flex:1; padding-right: 15px;">
                                    <label style="font-size: 0.95rem; color: #cbd5e1; user-select: none;">${r.label}</label>
                                </div>
                                <div style="display: flex; gap: 15px; align-items: center; user-select: none;">
                                    <button class="btn-secondary" id="btn-drem-${r.id}" style="padding: 0.4rem 0.8rem; font-size: 0.85rem; border-radius: 6px; display:inline-flex; align-items:center; gap: 0.4rem;">
                                        <i class="ph ph-envelope-simple"></i> Generar Borrador
                                    </button>
                                </div>
                            `;
                            reqList.appendChild(li);

                            li.querySelector(`#btn-drem-${r.id}`).addEventListener('click', async (e) => {
                                const btn = e.currentTarget;
                                const originalHtml = btn.innerHTML;
                                btn.disabled = true;
                                btn.innerHTML = `<i class="ph ph-spinner ph-spin"></i> Sincronizando...`;

                                try {
                                    const reqObj = window.currentEventRequisitos || {};
                                    if (!reqObj.form_inscripcion_url) {
                                        Swal.fire('Atención', 'No se ha encontrado la URL del formulario de inscripción. Asegúrate de que la carpeta y el formulario se hayan creado correctamente en la etapa 2.', 'warning');
                                        return;
                                    }

                                    // --- LÓGICA DE SINCRONIZACIÓN INTELIGENTE ---
                                    if (!reqData.responses_sheet_url) {
                                        // 1. Llamar a GAS para vincular Sheets y obtener respuestas
                                        const gasResponse = await fetch(GOOGLE_APP_SCRIPT_WEBHOOK_URL, {
                                            method: 'POST', mode: 'cors',
                                            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                                            body: JSON.stringify({
                                                action: 'vincular_y_obtener_respuestas',
                                                data: {
                                                    form_url: reqObj.form_inscripcion_url,
                                                    folder_url: reqObj.folder_url
                                                }
                                            })
                                        });
                                        const result = await gasResponse.json();

                                        if (result.status === "ok") {
                                            // 2. Guardar URL de Sheets en Requisitos
                                            reqData.responses_sheet_url = result.spreadsheet_url;
                                            await updateReqsInDB(reqData);

                                            // 3. Sincronizar Participantes a Supabase (Upsert)
                                            if (result.responses && result.responses.length > 0) {
                                                const findVal = (row, possibleKeys) => {
                                                    const key = Object.keys(row).find(k =>
                                                        possibleKeys.some(pk => k.toLowerCase().replace(/\s/g, '').includes(pk.toLowerCase().replace(/\s/g, '')))
                                                    );
                                                    return key ? row[key] : null;
                                                };

                                                const participantesToUpsert = result.responses.map(r => {
                                                    return {
                                                        evento_id: eventData.id,
                                                        dni: r['DNI:'] || r['DNI'] || findVal(r, ['DNI']) || 'N/A',
                                                        nombres: r['Nombres:'] || r['Nombres'] || findVal(r, ['Nombres']),
                                                        apellidos: r['Apellidos:'] || r['Apellidos'] || findVal(r, ['Apellid']),
                                                        correo: r['Correo electrónico (Coloca el correo institucional de Certus, ejemplo: DNI@certus.edu.pe o tu correo personal si no tienes)'] || r['Correo'] || findVal(r, ['Correo']),
                                                        telefono: r['Número del celular activo (Nos comunicaremos a este número)'] || r['Número del celular'] || findVal(r, ['Celular', 'Telefono']),
                                                        categoria: r['Usted como parte de la familia CERTUS es:'] || r['Ciclo:'] || findVal(r, ['familia', 'Ciclo', 'Categoria']),
                                                        asistencia: false
                                                    };
                                                }).filter(p => p.dni !== 'N/A');

                                                if (participantesToUpsert.length > 0) {
                                                    await window.supabaseClient
                                                        .from('participantes')
                                                        .upsert(participantesToUpsert, { onConflict: 'dni, evento_id' });
                                                }
                                            }
                                        } else {
                                            throw new Error(result.message || "Error en GAS");
                                        }
                                    }

                                    // 4. Mostrar el Borrador usando el nuevo Modal Custom
                                    window.openReminderDraftModal(eventData, reqData);

                                    // MARCAR COMO COMPLETADO Y REFRESCAR UI
                                    reqData[r.id] = true;
                                    await updateReqsInDB(reqData);
                                    window.openStatusModal(encodeURIComponent(JSON.stringify(eventData)));

                                } catch (error) {
                                    console.error(error);
                                    Swal.fire('Error', 'No se pudo generar el borrador: ' + error.message, 'error');
                                } finally {
                                    // Restaurar el botón original pase lo que pase
                                    if (btn) {
                                        btn.disabled = false;
                                        btn.innerHTML = originalHtml;
                                    }
                                }
                            });

                            if (reqData[r.id] !== true) isStepCompletable = false;

                            return;
                        }

                        // --- SPECIAL LOGIC FOR ACTION_LINK (Direct Button) ---
                        if (r.type === 'action_link') {
                            li.innerHTML = `
                                <div style="flex:1; padding-right: 15px;">
                                    <label style="font-size: 0.95rem; color: #cbd5e1; user-select: none;">${r.label}</label>
                                </div>
                                <div style="display: flex; gap: 15px; align-items: center; user-select: none;">
                                                    <a href="${r.target}" target="_blank" class="btn-primary" style="padding: 0.4rem 0.8rem; font-size: 0.85rem; border-radius: 6px; display:inline-flex; align-items:center; gap: 0.4rem; text-decoration: none;">
                                                        Abrir Formulario <i class="ph ph-arrow-square-out"></i>
                                                    </a>
                                                </div>
                                            `;
                            reqList.appendChild(li);

                            // Marcarlo como completado internamente si deseamos, o dejar que el usuario use los checkbox abajo para validar.
                            // Dejamos que los checkbox sean la validación real.
                            reqData[r.id] = true;
                            // updateReqsInDB no es super estricto aquí porque no bloquea avance por si solo.
                            return;
                        }

                        // --- SPECIAL LOGIC FOR ACTION_DRAFT (Generate Text Popup) ---
                        else if (r.type === 'action_draft') {
                            li.innerHTML = `
                                <div style="flex:1; padding-right: 15px;">
                                    <label style="font-size: 0.95rem; color: #cbd5e1; user-select: none;">${r.label}</label>
                                </div>
                                <div style="display: flex; gap: 15px; align-items: center; user-select: none;">
                                                    <button class="btn-secondary" id="btn-draft-${r.id}" style="padding: 0.4rem 0.8rem; font-size: 0.85rem; border-radius: 6px; display:inline-flex; align-items:center; gap: 0.4rem;">
                                                        <i class="ph ph-magic-wand"></i> Generar Borrador
                                                    </button>
                                                </div>
                                            `;
                            reqList.appendChild(li);

                            li.querySelector(`#btn-draft-${r.id}`).addEventListener('click', () => {
                                // Extract phones mapping
                                const phoneMap = {
                                    'Eduardo': '973590390',
                                    'Jorge': '949665939',
                                    'Carlos': '977180768',
                                    'José': '947616127',
                                    'Luis': '991430872',
                                    'Mirko': '971295157'
                                };
                                const emailMap = {
                                    'Eduardo': 'emamanir@certus.edu.pe',
                                    'Mirko': 'mnsanchez@certus.edu.pe',
                                    'José': 'jramirezp@certus.edu.pe',
                                    'Jorge': 'jdurand@gmail.com', // or jdurand@certus.edu.pe ? user said gmail
                                    'Carlos': 'cybarram@certus.edu.pe',
                                    'Luis': 'lcondors@certus.edu.pe'
                                };

                                let userPhone = '';
                                let userEmail = '';
                                if (eventData.responsable) {
                                    // Pilla el primero
                                    const firstResp = eventData.responsable.split(',')[0].trim();
                                    userPhone = phoneMap[firstResp] || '';
                                    userEmail = emailMap[firstResp] || '[Responsable (correo electrónico)]';
                                }

                                // Determinar Sede y Horario
                                const sedesFormatted = eventData.sedes ? eventData.sedes : 'No asignada';
                                let eventHorarioStr = '[día o días del evento] y hora';
                                let plazoEntregaStr = '[calcular...]';
                                try {
                                    const hStr = eventData.horario || '[]';
                                    const hrs = typeof hStr === 'string' ? JSON.parse(hStr) : hStr;
                                    if (hrs.length > 0 && hrs[0].fecha) {
                                        let rawDate = hrs[0].fecha;

                                        // Calculate plazo (rawDate - 7 days)
                                        let dateObj = null;
                                        if (rawDate.includes('-') && rawDate.split('-')[0].length === 4) {
                                            const p = rawDate.split('-');
                                            dateObj = new Date(parseInt(p[0]), parseInt(p[1]) - 1, parseInt(p[2]));
                                        } else if (rawDate.includes('/')) {
                                            const p = rawDate.split('/');
                                            dateObj = new Date(parseInt(p[2]), parseInt(p[1]) - 1, parseInt(p[0]));
                                        }

                                        if (dateObj && !isNaN(dateObj)) {
                                            dateObj.setDate(dateObj.getDate() - 7);
                                            const pd = String(dateObj.getDate()).padStart(2, '0');
                                            const pm = String(dateObj.getMonth() + 1).padStart(2, '0');
                                            const py = dateObj.getFullYear();
                                            plazoEntregaStr = `${pd} /${pm}/${py} `;
                                        }

                                        // Format date YYYY-MM-DD to "DD de Mes del YYYY"
                                        let dateStr = rawDate;
                                        if (rawDate.includes('-') && rawDate.split('-')[0].length === 4) {
                                            const parts = rawDate.split('-');
                                            const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
                                            const dayNum = parseInt(parts[2], 10);
                                            const monthNum = parseInt(parts[1], 10);
                                            const yearNum = parts[0];
                                            if (monthNum >= 1 && monthNum <= 12) {
                                                dateStr = `${dayNum} de ${months[monthNum - 1]} del ${yearNum} `;
                                            }
                                        }
                                        eventHorarioStr = `${dateStr} desde las ${hrs[0].inicio || ''} hasta las ${hrs[0].fin || ''} `;
                                    }
                                } catch (e) { }

                                const modalModeText = eventData.modalidad === 'Virtual' ? 'a través de Zoom' : (eventData.modalidad === 'Presencial' ? `en sede ${sedesFormatted} ` : `a través de Zoom y en sede ${sedesFormatted} `);

                                let formLinkTexto = `[Link del formulario INSCRIPCION AL TALLER VIRTUAL: "${eventData.nombre}" creado en la carpeta]`;
                                try {
                                    // El draft se genera en la etapa 2, pero la URL se guardó globalmente en requisitos
                                    const reqObj = window.currentEventRequisitos || {};
                                    if (reqObj.form_inscripcion_url) {
                                        formLinkTexto = reqObj.form_inscripcion_url;
                                    } else {
                                        const reqDB = typeof eventData.requisitos === 'string' ? JSON.parse(eventData.requisitos) : (eventData.requisitos || {});
                                        if (reqDB.form_inscripcion_url) {
                                            formLinkTexto = reqDB.form_inscripcion_url;
                                        }
                                    }
                                } catch (e) { }

                                const draftFields = [
                                    { id: 'draft-f1', label: 'Correo de Jefe Directo', value: 'lhurtadoo@certus.edu.pe', isArea: false },
                                    { id: 'draft-f2', label: 'Número de contacto', value: userPhone, isArea: false },
                                    { id: 'draft-f3', label: 'Nombre del evento', value: eventData.nombre || '', isArea: false },
                                    { id: 'draft-f4', label: 'Área', value: 'Dirección Académica', isArea: false },
                                    { id: 'draft-f5', label: 'Público Objetivo', value: eventData.audiencia || 'Público en General', isArea: false },
                                    { id: 'draft-f6', label: 'Vertical involucrada', value: 'Finanzas', isArea: false },
                                    { id: 'draft-f7', label: 'Tipo de difusión', value: 'Comunicación Interna / Comunicación Digital', isArea: false },
                                    { id: 'draft-f8', label: 'Detalles del Pedido', value: `Invitar a ${eventData.audiencia || '[público objetivo]'} a participar en el evento tipo ${eventData.tipo} "${eventData.nombre}" que se realizará el ${eventHorarioStr} ${modalModeText}, con inscripción previa.Incluye constancia de participación.Ponente: ${eventData.ponente} `, isArea: true },
                                    { id: 'draft-f8_1', label: 'Enlaces Relacionados', value: formLinkTexto, isArea: false },
                                    { id: 'draft-f8_2', label: 'Contacto', value: `Pueden escribir a ${userEmail} o enviar un whatsapp al ${userPhone || '[numero telefonico]'} `, isArea: false },
                                    { id: 'draft-f9', label: 'Plazo de entrega del pedido', value: plazoEntregaStr, isArea: false },
                                    { id: 'draft-f10', label: 'Urgencia del Pedido', value: 'No', isArea: false }
                                ];

                                let htmlGrid = '<div style="display: flex; flex-direction: column; gap: 1rem; text-align: left; max-height: 60vh; overflow-y: auto; overflow-x: hidden; padding-right: 15px; width: 100%; box-sizing: border-box;">';
                                draftFields.forEach(f => {
                                    let btnExtra = '';
                                    if (f.id === 'draft-f8_1') {
                                        // Extra logic to fetch link if missing
                                        const storedFolderUrl = (window.currentEventRequisitos && window.currentEventRequisitos.folder_url) || '';
                                        btnExtra = `<button onclick="window.fetchDraftFormLink(this, '${storedFolderUrl}', ${eventData.id})" class="btn-fetch-link" style="width: 38px; height: 38px; min-width: 38px; border-radius: 6px; background: #3b82f6; border: 1px solid #2563eb; color: #ffffff; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; padding: 0; box-sizing: border-box; margin-right: 5px;" title="Obtener link directo de Drive" onmouseover="this.style.background='#2563eb';" onmouseout="this.style.background='#3b82f6';">
                                                <i class="ph ph-arrows-clockwise" style="font-size: 1.2rem; pointer-events: none;"></i>
                                        </button>`;
                                    }

                                    htmlGrid += `
                                        <div style="width: 100%; box-sizing: border-box;">
                                            <label style="font-size: 0.85rem; font-weight: bold; color: #475569; margin-bottom: 0.3rem; display: block;">${f.label}</label>
                                            <div style="display: flex; gap: 8px; align-items: flex-start; width: 100%; box-sizing: border-box;">
                                                ${f.isArea ?
                                            `<textarea id="${f.id}" readonly style="width: calc(100% - ${btnExtra ? '92px' : '46px'}); padding: 0.6rem; border-radius: 6px; border: 1px solid #cbd5e1; background: #f8fafc; color: #1e293b; font-size: 0.95rem; resize: vertical; min-height: 100px; font-family: inherit; box-sizing: border-box; outline: none;">${f.value}</textarea>` :
                                            `<input type="text" id="${f.id}" readonly value='${f.value}' style="width: calc(100% - ${btnExtra ? '92px' : '46px'}); padding: 0.6rem; border-radius: 6px; border: 1px solid #cbd5e1; background: #f8fafc; color: #1e293b; font-size: 0.95rem; font-family: inherit; box-sizing: border-box; outline: none;">`
                                        }
                                                ${btnExtra}
                                                <button class="btn-copy-field" data-target="${f.id}" style="width: 38px; height: 38px; min-width: 38px; border-radius: 6px; background: #e2e8f0; border: 1px solid #cbd5e1; color: #475569; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; padding: 0; box-sizing: border-box;" title="Copiar este campo" onmouseover="this.style.background='#cbd5e1'; this.style.color='#1e293b';" onmouseout="this.style.background='#e2e8f0'; this.style.color='#475569';">
                                                    <i class="ph ph-copy" style="font-size: 1.2rem; pointer-events: none;"></i>
                                                </button>
                                            </div>
                                        </div>
                                    `;
                                });
                                htmlGrid += '</div>';

                                // Define asynchronous fetcher for the popup button
                                window.fetchDraftFormLink = async function (btnNode, folderUrl, eventId) {
                                    if (!folderUrl) {
                                        Swal.fire({ title: 'Uy!', text: 'Primero debes crear la carpeta del evento en el estado "Planificado".', icon: 'warning', target: document.getElementById('status-modal') });
                                        return;
                                    }
                                    const icon = btnNode.querySelector('i');
                                    icon.classList.add('ph-spin');
                                    btnNode.disabled = true;

                                    try {
                                        const response = await fetch(GOOGLE_APP_SCRIPT_WEBHOOK_URL, {
                                            method: 'POST', mode: 'cors',
                                            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                                            body: JSON.stringify({ action: 'verificar_carpeta_evento', data: { folder_url: folderUrl } })
                                        });
                                        const result = await response.json();
                                        if (result.status === "ok" && result.form_inscripcion_url) {
                                            // Update input UI
                                            const inputEl = document.getElementById('draft-f8_1');
                                            if (inputEl) inputEl.value = result.form_inscripcion_url;

                                            // Save silently to DB to persist
                                            let currentReqs = window.currentEventRequisitos || {};
                                            currentReqs.form_inscripcion_url = result.form_inscripcion_url;

                                            await window.supabaseClient.from('eventos').update({ requisitos: currentReqs }).eq('id', eventId);
                                        } else {
                                            Swal.fire({ title: 'Aviso', text: 'No se encontró un Google Form dentro de la carpeta.', icon: 'info', target: document.getElementById('status-modal') });
                                        }
                                    } catch (e) {
                                        console.error(e);
                                    } finally {
                                        icon.classList.remove('ph-spin');
                                        btnNode.disabled = false;
                                    }
                                };

                                Swal.fire({
                                    title: 'Borrador Generado',
                                    html: htmlGrid,
                                    width: '800px',
                                    showCloseButton: true,
                                    showConfirmButton: false,
                                    showCancelButton: true,
                                    cancelButtonText: 'Cerrar',
                                    cancelButtonColor: '#64748b',
                                    focusCancel: true,
                                    didOpen: () => {
                                        const popup = Swal.getPopup();
                                        const copyBtns = popup.querySelectorAll('.btn-copy-field');
                                        copyBtns.forEach(btn => {
                                            btn.addEventListener('click', (e) => {
                                                const targetId = e.currentTarget.getAttribute('data-target');
                                                const inputEl = document.getElementById(targetId);
                                                if (inputEl) {
                                                    inputEl.select();
                                                    navigator.clipboard.writeText(inputEl.value);

                                                    // Visual feedback on button
                                                    const icon = e.currentTarget.querySelector('i');
                                                    icon.className = 'ph ph-check';
                                                    icon.style.color = '#10b981';
                                                    setTimeout(() => {
                                                        icon.className = 'ph ph-copy';
                                                        icon.style.color = '';
                                                    }, 1500);
                                                }
                                            });
                                        });
                                    }
                                });

                                reqData[r.id] = true;
                            });
                            return;
                        }

                        // --- SPECIAL LOGIC FOR ACTION_DRIVE (CREATE FOLDER) ---
                        else if (r.type === 'action_drive') {
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
                                                if (result.form_inscripcion_url && !reqData.form_inscripcion_url) {
                                                    reqData.form_inscripcion_url = result.form_inscripcion_url;
                                                }
                                                box.innerHTML = `
                                                    <span style="color: #10b981; font-weight: bold; font-size: 0.85rem;"><i class="ph ph-check-circle"></i> CARPETA CREADA</span>
                                                    <a href="${reqData.folder_url}" target="_blank" class="btn-primary" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; border-radius: 4px; display:inline-flex; align-items:center; gap: 0.3rem;"><i class="ph ph-folder-open"></i> Ir a carpeta</a>
                                                `;
                                                reqData[r.id] = true;
                                                await updateReqsInDB(reqData); // Ensure URL saves even if already exist
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
                                const folderName = `${dayStr} / ${monStr} ${eventData.nombre} ${eventData.tipo}`;

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
                                                event_tipo: eventData.tipo || "Evento",
                                                event_horario_str: eventHorarioStr
                                            }
                                        })
                                    });

                                    const result = await response.json();

                                    if (result.status === "ok" && result.folder_url) {
                                        reqData.folder_url = result.folder_url;
                                        if (result.form_inscripcion_url) {
                                            reqData.form_inscripcion_url = result.form_inscripcion_url;
                                        }
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
                newPonente = ponenteInput.value;
                // Exigimos ponente solo si vamos al paso 2 (Formalizado) o más adelante
                if ((!newPonente || newPonente === 'Pendiente') && nextStep >= 2) {
                    Swal.fire('Atención', 'Debe asignar un ponente válido de la lista para poder avanzar de estado a partir de esta fase.', 'warning');
                    return;
                }
                if (newPonente === 'new_ponente') {
                    Swal.fire({
                        icon: 'info',
                        title: 'Nuevo Ponente',
                        text: 'Para agregar un nuevo ponente, por favor cierre esta ventana temporalmente y utilice el botón en la creación de eventos o el menú correspondiente.'
                    });
                    return;
                }
                // Si están en paso 1 y lo dejaron en Pendiente, guardamos Pendiente
                if (!newPonente || newPonente === 'new_ponente') {
                    newPonente = "Pendiente";
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
            const { error: updateError } = await window.supabaseClient
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
            const { error: updateError } = await window.supabaseClient
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
                const targetBtn = document.querySelector(`[data-target="${flowConfig.redirect}"]`);
                if (targetBtn) targetBtn.click();
            }
        }

        try {
            const updatePayload = { status: targetStep };
            if (newPonente) {
                updatePayload.ponente = newPonente;
                eventData.ponente = newPonente;
            }

            const { error: updateError } = await window.supabaseClient
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
                title: `Estado actualizado a: ${getStatusText(targetStep)} `
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
                    if (partesIni.length === 3) fechaInicioStr = `${partesIni[2]} /${partesIni[1]}/${partesIni[0]} `;

                    const partesFin = schedule[schedule.length - 1].fecha.split('-');
                    if (partesFin.length === 3) fechaFinStr = `${partesFin[2]} /${partesFin[1]}/${partesFin[0]} `;

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
                        primeraHora = `${mH}:${mm} ${ampm} `;
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
    const btnProcessCsv = document.getElementById('btn-process-csv'); // Renamed from processBtn for consistency
    const previewContainer = document.getElementById('preview-container');
    const tableBody = document.getElementById('participants-table-body');
    const statsSpan = document.getElementById('import-stats');
    const saveBtn = document.getElementById('btn-save-participants');

    let parsedParticipants = []; // Store data for backend submission

    if (btnProcessCsv) {
        btnProcessCsv.addEventListener('click', () => {
            const file = fileInput.files[0];
            const eventSelector = document.getElementById('cert-event-selector');

            if (eventSelector && !eventSelector.value) {
                Swal.fire('Atención', 'Por favor, primero seleccione un evento en la lista de arriba.', 'warning');
                return;
            }

            if (!file) {
                Swal.fire('Error', 'Por favor seleccione un archivo CSV primero.', 'error');
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
        console.log('Procesando CSV con PapaParse...');

        Papa.parse(csvText, {
            header: false,
            skipEmptyLines: true,
            complete: function (results) {
                const lines = results.data;
                if (lines.length < 2) {
                    Swal.fire('Error', 'El archivo parece vacío o no tiene cabeceras (filas insuficientes).', 'error');
                    return;
                }

                // 1. Detect Headers
                const headers = lines[0].map(h => h ? h.trim().toLowerCase() : '');

                // Map headers to internal keys
                const map = {
                    dni: headers.findIndex(h => h.includes('dni')),
                    nombres: headers.findIndex(h => h.includes('nombre') && !h.includes('apellido')),
                    apellidos: headers.findIndex(h => h.includes('apellido')),
                    correoInst: headers.findIndex(h => h.includes('institucional') || (h.includes('correo') && h.includes('electrónico'))),
                    correoPers: headers.findIndex(h => h.includes('personal') && h.includes('correo')),
                    telefono: headers.findIndex(h => h.includes('celular') || h.includes('teléfono') || h.includes('telefono') || h.includes('whatsapp') || h.includes('cel') || h.includes('movil') || h.includes('phone')),

                    // New fields
                    turno: headers.findIndex(h => h.includes('turno')),
                    ciclo: headers.findIndex(h => h.includes('ciclo') || h.includes('semestre')),
                    egresado: headers.findIndex(h => h.includes('egresado'))
                };

                // Combine names logic if there is only one column for "Apellidos y Nombres"
                // Often forms just say "Apellidos y Nombres completos"
                const combinedNameIndex = headers.findIndex(h => h.includes('apellidos y nombres') || h.includes('nombres y apellidos'));
                if (combinedNameIndex !== -1) {
                    map.nombres = combinedNameIndex;
                    map.apellidos = -1; // Ignore separate if combined is present
                }

                parsedParticipants = [];
                tableBody.innerHTML = '';

                let validCount = 0;
                let warningCount = 0;

                // 2. Parse Rows
                for (let i = 1; i < lines.length; i++) {
                    const row = lines[i];

                    if (!row || row.length < headers.length * 0.5) continue; // Skip empty/malformed

                    // Extract values safely
                    let dni = map.dni !== -1 ? (row[map.dni] || '') : '';
                    let nombresRaw = map.nombres !== -1 ? (row[map.nombres] || '') : '';
                    let apellidosRaw = map.apellidos !== -1 ? (row[map.apellidos] || '') : '';

                    let fullName = apellidosRaw ? `${apellidosRaw}, ${nombresRaw} ` : nombresRaw;

                    let emailInst = map.correoInst !== -1 ? (row[map.correoInst] || '') : '';
                    let emailPers = map.correoPers !== -1 ? (row[map.correoPers] || '') : '';

                    let telefono = map.telefono !== -1 ? (row[map.telefono] || '') : '';
                    telefono = telefono.replace(/\s+/g, '').replace(/\D/g, '');

                    let turno = map.turno !== -1 ? (row[map.turno] || '') : '';
                    let ciclo = map.ciclo !== -1 ? (row[map.ciclo] || '') : '';
                    let egresadoRaw = map.egresado !== -1 ? (row[map.egresado] || '') : '';
                    let esEgresado = egresadoRaw.toLowerCase().includes('si') || egresadoRaw.toLowerCase().includes('sí') || egresadoRaw.toLowerCase() === 'x';

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
                        status = 'warning';
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
                        id: i,
                        dni: dni,
                        nombresRaw: nombresRaw.trim(),
                        apellidosRaw: apellidosRaw.trim(),
                        nombre: fullName.trim(),
                        email: finalEmail.trim(),
                        telefono: telefono,
                        turno: turno.trim(),
                        ciclo: ciclo.trim(),
                        esEgresado: esEgresado,
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
            },
            error: function (err) {
                console.error("PapaParse error:", err);
                Swal.fire('Error', 'Hubo un error al procesar el archivo CSV.', 'error');
            }
        });
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
                                < td > <span class="status-badge ${badgeClass}" title="${p.msg}">${badgeText}</span></td >
            <td><input type="text" class="table-input ${p.status === 'error' && p.dni.length !== 8 ? 'invalid' : ''}" value="${p.dni}" onchange="updateParticipant(${p.id}, 'dni', this.value)" style="width: 80px;"></td>
            <td><input type="text" class="table-input" value="${p.nombre}" onchange="updateParticipant(${p.id}, 'nombre', this.value)" style="width: 150px;"></td>
            <td><input type="email" class="table-input ${!isValidEmail(p.email) ? 'invalid' : ''}" value="${p.email}" onchange="updateParticipant(${p.id}, 'email', this.value)" style="width: 150px;"></td>
            <td><input type="text" class="table-input" value="${p.telefono || ''}" onchange="updateParticipant(${p.id}, 'telefono', this.value)" style="width: 90px;"></td>
            <td><input type="text" class="table-input" value="${p.turno || ''}" onchange="updateParticipant(${p.id}, 'turno', this.value)" style="width: 80px;"></td>
            <td><input type="text" class="table-input" value="${p.ciclo || ''}" onchange="updateParticipant(${p.id}, 'ciclo', this.value)" style="width: 80px;"></td>
            <td style="text-align: center;"><input type="checkbox" ${p.esEgresado ? 'checked' : ''} onchange="updateParticipant(${p.id}, 'esEgresado', this.checked)"></td>
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
            const finalFirstName = cleanLabel ? `${cleanLabel}_${firstNameRaw} ` : firstNameRaw;

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
            fieldBody.value = body;

            // 5. Generate Mailto
            const mailtoParams = new URLSearchParams();
            mailtoParams.append('bcc', emailList);
            mailtoParams.append('subject', subject);
            mailtoParams.append('body', body);

            mailtoLink.href = `mailto:? ${mailtoParams.toString().replace(/\+/g, '%20')} `;
            mailtoLink.classList.remove('hidden');

            Swal.fire({
                toast: true, position: 'top-end', icon: 'success', title: 'Datos generados. Usa los botones "Copiar" o abre tu cliente de correo.',
                showConfirmButton: false, timer: 4000
            });
        });
    }

    window.copyToClipboard = function (elementId) {
        const el = document.getElementById(elementId);
        if (!el) return;
        el.select();
        document.execCommand('copy');

        // Visual feedback
        const btn = el.parentElement.querySelector('button');
        const oldHtml = btn.innerHTML;
        btn.innerHTML = '<i class="ph ph-check" style="color:#10b981;"></i>';
        setTimeout(() => btn.innerHTML = oldHtml, 2000);
    };

    // --- CERTIFICATES: DATABASE SAVING & PORTAL LOGIC ---

    // 1. Selector Change Event -> Load DB 
    const certEventSelector = document.getElementById('cert-event-selector');
    if (certEventSelector) {
        certEventSelector.addEventListener('change', (e) => {
            loadEventParticipantsDB(e.target.value);
        });
    }

    // 2. Load Participants from DB
    async function loadEventParticipantsDB(eventId) {
        const tbody = document.getElementById('db-participants-table-body');
        if (!tbody) return;

        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 2rem;"><i class="ph ph-spinner ph-spin"></i> Cargando estudiantes...</td></tr>';

        try {
            const { data, error } = await window.supabaseClient
                .from('participantes')
                .select('*')
                .eq('evento_id', eventId)
                .order('apellidosRaw', { ascending: true }); // We'll try to order, might fallback to name if column doesnt exist

            if (error) throw error;

            tbody.innerHTML = '';

            if (data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 2rem; color: var(--text-muted);">Aún no hay estudiantes guardados en la base de datos para este evento.</td></tr>';
                return;
            }

            data.forEach(p => {
                const tr = document.createElement('tr');
                const certStatus = p.certificado_url ?
                    `< a href = "${p.certificado_url}" target = "_blank" style = "color: #3b82f6; text-decoration: underline;" > <i class="ph ph-file-pdf"></i> Ver Certificado</a > ` :
                    `< span style = "color: #f59e0b;" > <i class="ph ph-clock"></i> Pendiente</span > `;

                tr.innerHTML = `
                                < td style = "font-family: monospace;" > ${p.dni}</td >
                    <td><b>${p.nombres}</b></td>
                    <td>${p.correo || '-'}</td>
                    <td>${certStatus}</td>
                            `;
                tbody.appendChild(tr);
            });

        } catch (error) {
            console.error("Error cargando participantes DB:", error);
            tbody.innerHTML = `< tr > <td colspan="4" style="text-align:center; color: #ef4444; padding: 1rem;">Error al cargar datos.</td></tr > `;
        }
    }

    // 3. Save Parsed Participants to DB
    const btnSaveParticipantsDb = document.getElementById('btn-save-participantsdb');
    if (btnSaveParticipantsDb) {
        btnSaveParticipantsDb.addEventListener('click', async () => {
            const eventId = certEventSelector ? certEventSelector.value : null;

            if (!eventId) {
                Swal.fire('Error', 'Selecciona a qué evento pertenecen estos estudiantes en el paso 1.', 'error');
                return;
            }

            const validParticipants = parsedParticipants.filter(p => p.status === 'ok');

            if (validParticipants.length === 0) {
                Swal.fire('Atención', 'No hay estudiantes válidos (Status OK) en la lista para guardar.', 'warning');
                return;
            }

            const confirm = await Swal.fire({
                title: '¿Guardar en Base de Datos?',
                text: `Se insertarán ${validParticipants.length} estudiantes al evento seleccionado. ¿Continuar ? `,
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'Sí, guardar',
                cancelButtonText: 'Cancelar'
            });

            if (!confirm.isConfirmed) return;

            // Show Loading
            const originalIcon = btnSaveParticipantsDb.innerHTML;
            btnSaveParticipantsDb.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Guardando...';
            btnSaveParticipantsDb.disabled = true;

            try {
                // Prepare array for Supabase
                const payload = validParticipants.map(p => ({
                    evento_id: eventId,
                    dni: p.dni,
                    nombres: p.nombre, // We mapped fullName to 'nombre' in parser
                    correo: p.email,
                    telefono: p.telefono,
                    turno: p.turno,
                    ciclo: p.ciclo,
                    es_egresado: p.esEgresado,
                    asistencia: true
                }));

                const { data, error } = await window.supabaseClient
                    .from('participantes')
                    .insert(payload);

                if (error) throw error;

                Swal.fire('Exito!', `Se guardaron ${validParticipants.length} estudiantes correctamente en Supabase.`, 'success');

                // Clear parser view to prevent double-saving
                parsedParticipants = [];
                document.getElementById('participants-table-body').innerHTML = '';
                document.getElementById('preview-container').classList.add('hidden');

                // Reload DB View
                loadEventParticipantsDB(eventId);

            } catch (err) {
                console.error("Error guardando participantes:", err);
                Swal.fire('Error', 'No se pudieron guardar los participantes en la base de datos: ' + err.message, 'error');
            } finally {
                btnSaveParticipantsDb.innerHTML = originalIcon;
                btnSaveParticipantsDb.disabled = false;
            }
        });
    }

    // Initial check on load
    document.addEventListener('DOMContentLoaded', () => {
        // Any init logic
    });

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
                    const { data: preExist } = await window.supabaseClient.from('eventos').select('sheet_id').in('sheet_id', checkIds);
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
                    const { data: dbPonentes, error: errPon } = await window.supabaseClient.from('ponentes').select('nombres, apellidos');
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
                            await window.supabaseClient.from('ponentes').insert(ponentesNuevos);
                        }
                    }
                }

                const sheetIdsToSync = parsedImportEventData.map(e => e.sheet_id);
                const { data: existingRecords, error: fetchErr } = await window.supabaseClient
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

                const { error: upsertError } = await window.supabaseClient
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

// --- Lógica del Modal de Revisión de Participantes (Iteration 13) ---
window.currentParticipantsData = [];
window.currentEventIdForReview = null;

async function openParticipantReviewModal(eventId) {
    if (!eventId) {
        console.error("No eventId provided to openParticipantReviewModal");
        return;
    }

    window.currentEventIdForReview = eventId;
    const modal = document.getElementById('participant-review-modal');
    const tableBody = document.getElementById('modal-participants-table-body');

    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    modal.setAttribute('aria-modal', 'true');
    // Eliminar aria-hidden del contenedor principal si existe para evitar conflictos de accesibilidad
    document.querySelector('.app-container')?.setAttribute('aria-hidden', 'true');

    tableBody.innerHTML = '<tr><td colspan="9" style="text-align:center; padding: 2rem;"><i class="ph ph-circle-notch ph-spin"></i> Cargando participantes...</td></tr>';
    modal.removeAttribute('data-previous-aria-hidden'); // Limpiar rastros de librerías externas


    try {
        // Asegurarse de que eventId sea el tipo correcto (entero según el esquema)
        const idToQuery = parseInt(eventId);

        const { data, error } = await window.supabaseClient
            .from('participantes')
            .select('*')
            .eq('evento_id', idToQuery);

        // Quitamos el .order('apellidos') por ahora por si la columna no existe aún
        // Ordenaremos en memoria para ser más robustos
        if (error) throw error;

        let participants = data || [];

        // Ordenar por apellidos si la columna existe, sino por nombres
        participants.sort((a, b) => {
            const nameA = (a.apellidos || a.nombres || "").toLowerCase();
            const nameB = (b.apellidos || b.nombres || "").toLowerCase();
            return nameA.localeCompare(nameB);
        });

        window.currentParticipantsData = participants;
        renderReviewTable(window.currentParticipantsData);

    } catch (err) {
        console.error("Error al cargar participantes:", err);
        tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#f87171; padding: 2rem;">
            <i class="ph ph-warning-circle" style="font-size: 2rem; display: block; margin-bottom: 0.5rem;"></i>
            Error al cargar datos: ${err.message}<br>
            <small style="color: var(--text-muted);">Asegúrate de haber ejecutado 'db_fix_missing_columns.sql' en Supabase.</small>
        </td></tr>`;
    }
}

function renderReviewTable(participants) {
    const tableBody = document.getElementById('modal-participants-table-body');
    if (!tableBody) return;

    tableBody.innerHTML = '';
    window.lastRenderedParticipants = participants;

    let okCount = 0;
    let obsCount = 0;

    // Reset select all checkbox
    const selectAllCheckbox = document.getElementById('select-all-participants');
    if (selectAllCheckbox) selectAllCheckbox.checked = false;
    toggleDeleteButton();

    // Fix ARIA focus issues: ensure modal is visible before rendering content
    const modal = document.getElementById('participant-review-modal');
    modal.setAttribute('aria-hidden', 'false');

    if (!participants || participants.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="9" style="text-align:center; padding: 2rem; color: #94a3b8;">No hay participantes registrados.</td></tr>';
    } else {
        participants.forEach((p, index) => {
            const validation = validateParticipant(p);
            if (validation.isValid) okCount++; else obsCount++;

            const tr = document.createElement('tr');
            tr.className = 'participant-row';
            tr.innerHTML = `
                <td><input type="checkbox" class="participant-check" onchange="toggleParticipantSelection()" data-index="${index}"></td>
                <td><input type="text" class="inline-edit ${validation.errors.dni ? 'field-error' : ''}" value="${p.dni || ''}" 
                    style="border:none; background:transparent;" onchange="updateLocalParticipant(${index}, 'dni', this.value)"></td>
                <td><input type="text" class="inline-edit" value="${p.nombres || ''}" 
                    style="border:none; background:transparent;" onchange="updateLocalParticipant(${index}, 'nombres', this.value)"></td>
                <td><input type="text" class="inline-edit" value="${p.apellidos || ''}" 
                    style="border:none; background:transparent;" onchange="updateLocalParticipant(${index}, 'apellidos', this.value)"></td>
                <td><input type="text" class="inline-edit ${validation.errors.correo ? 'field-error' : ''}" value="${p.correo || ''}" 
                    style="border:none; background:transparent;" onchange="updateLocalParticipant(${index}, 'correo', this.value)"></td>
                <td><input type="text" class="inline-edit ${validation.errors.telefono ? 'field-error' : ''}" value="${p.telefono || ''}" 
                    style="border:none; background:transparent;" onchange="updateLocalParticipant(${index}, 'telefono', this.value)"></td>
                <td><input type="text" class="inline-edit" value="${p.categoria || ''}" 
                    style="border:none; background:transparent;" onchange="updateLocalParticipant(${index}, 'categoria', this.value)"></td>
                <td style="text-align:center;"><input type="checkbox" ${p.certificado_autorizado !== false ? 'checked' : ''} 
                    onchange="updateLocalParticipant(${index}, 'certificado_autorizado', this.checked)"></td>
                <td><span class="status-badge ${validation.isValid ? 'ok' : 'error'}">${validation.isValid ? 'OK' : 'Obs'}</span></td>
                <td><button type="button" class="btn-icon-remove" title="Eliminar" onclick="deleteSingleParticipant(${index})"><i class="ph ph-trash"></i></button></td>
            `;
            tableBody.appendChild(tr);
        });
    }

    document.getElementById('total-participants').innerText = participants.length;
    document.getElementById('ok-participants').innerText = okCount;
    document.getElementById('obs-participants').innerText = obsCount;
}

// --- Nuevas funciones de gestión de participantes ---

function toggleSelectAllParticipants(checked) {
    const checks = document.querySelectorAll('.participant-check');
    checks.forEach(cb => cb.checked = checked);
    toggleDeleteButton();
}

function toggleParticipantSelection() {
    const total = document.querySelectorAll('.participant-check').length;
    const checked = document.querySelectorAll('.participant-check:checked').length;
    const selectAllCheckbox = document.getElementById('select-all-participants');
    if (selectAllCheckbox) {
        selectAllCheckbox.checked = total === checked && total > 0;
    }
    toggleDeleteButton();
}

function toggleDeleteButton() {
    const checked = document.querySelectorAll('.participant-check:checked').length;
    const btn = document.getElementById('btn-delete-selected');
    if (btn) {
        btn.style.display = checked > 0 ? 'inline-flex' : 'none';
    }
}

async function deleteSingleParticipant(index) {
    const participant = window.lastRenderedParticipants[index];
    if (!participant) return;

    const result = await Swal.fire({
        title: '¿Eliminar participante?',
        text: `¿Estás seguro de eliminar a ${participant.nombres} ${participant.apellidos}?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#f87171',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
        try {
            const { error } = await window.supabaseClient
                .from('participantes')
                .delete()
                .eq('id', participant.id);

            if (error) throw error;

            Swal.fire('Eliminado', 'El participante ha sido eliminado.', 'success');
            // Recargar la lista
            openParticipantReviewModal(window.currentEventIdForReview);
        } catch (err) {
            console.error(err);
            Swal.fire('Error', 'No se pudo eliminar: ' + err.message, 'error');
        }
    }
}

async function deleteSelectedParticipants() {
    const selectedChecks = document.querySelectorAll('.participant-check:checked');
    const idsToDelete = Array.from(selectedChecks).map(cb => {
        const idx = parseInt(cb.getAttribute('data-index'));
        return window.lastRenderedParticipants[idx].id;
    });

    if (idsToDelete.length === 0) return;

    const result = await Swal.fire({
        title: '¿Eliminar seleccionados?',
        text: `¿Estás seguro de eliminar a los ${idsToDelete.length} participantes seleccionados?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#f87171',
        confirmButtonText: 'Sí, eliminar todos',
        cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
        try {
            const { error } = await window.supabaseClient
                .from('participantes')
                .delete()
                .in('id', idsToDelete);

            if (error) throw error;

            Swal.fire('Eliminados', `${idsToDelete.length} participantes han sido eliminados.`, 'success');
            openParticipantReviewModal(window.currentEventIdForReview);
        } catch (err) {
            console.error(err);
            Swal.fire('Error', 'No se pudieron eliminar: ' + err.message, 'error');
        }
    }
}

function addParticipantsToDraft() {
    console.log("addParticipantsToDraft called");
    const participants = window.lastRenderedParticipants || [];
    console.log("Participants found:", participants.length);
    // Filtrar duplicados por correo y validar formato
    const uniqueEmails = [...new Set(participants.map(p => p.correo?.trim()).filter(email => email && email.includes('@')))];
    const emails = uniqueEmails.join(', ');
    console.log("Extracted emails:", emails);

    const ccoField = document.getElementById('rem-draft-cco');
    const certCcoField = document.getElementById('cert-draft-cco');
    const targetField = document.getElementById('reminder-draft-modal').classList.contains('active') ? ccoField : certCcoField;

    if (targetField) {
        targetField.value = emails;
        console.log("Updated CCO field");

        // Usar un método que no cierre otros modales si es posible
        const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true
        });
        Toast.fire({
            icon: 'success',
            title: `Se agregaron ${uniqueEmails.length} destinatarios`
        });
    } else {
        Swal.fire('Atención', 'El modal de borrador no parece estar abierto.', 'info');
    }
}

function copyReminderDraft() {
    const to = document.getElementById('rem-draft-to').value;
    const cc = document.getElementById('rem-draft-cc').value;
    const cco = document.getElementById('rem-draft-cco').value;
    const subject = document.getElementById('rem-draft-subject').value;
    const body = document.getElementById('rem-draft-text').value;

    const fullText = `PARA: ${to}\nCC: ${cc}\nCCO: ${cco}\nASUNTO: ${subject}\n\n${body}`;

    navigator.clipboard.writeText(fullText).then(() => {
        Swal.fire('Copiado', 'Toda la información del correo ha sido copiada al portapapeles.', 'success');
    });
}

function validateParticipant(p) {
    if (!p) return { isValid: false, errors: { dni: true, correo: true, telefono: true } };

    // El DNI debe tener exactamente 8 caracteres (pueden empezar con 0)
    const dniRaw = p.dni ? p.dni.toString().trim() : '';
    const isDniValid = dniRaw.length === 8 && /^\d+$/.test(dniRaw);

    // Validación de correo con dominios permitidos
    const emailRaw = p.correo ? p.correo.toString().trim().toLowerCase() : '';
    const allowedDomains = ['@gmail.com', '@hotmail.com', '@certus.edu.pe', '@outlook.com', '@yahoo.com'];
    const hasAllowedDomain = allowedDomains.some(domain => emailRaw.endsWith(domain));
    const isEmailValid = emailRaw.includes('@') && emailRaw.includes('.') && hasAllowedDomain;

    const errors = {
        dni: !isDniValid,
        correo: !isEmailValid,
        telefono: !p.telefono || (p.telefono && p.telefono.toString().replace(/\s/g, '').length < 7)
    };

    return {
        isValid: !errors.dni && !errors.correo && !errors.telefono,
        errors: errors
    };
}

function updateLocalParticipant(indexInList, field, value) {
    const listSource = window.lastRenderedParticipants || [];
    const participant = listSource[indexInList];
    if (!participant) return;

    // Actualizar en el objeto local (referencia)
    participant[field] = value;

    // Sincronizar con el estado global real (por si acaso estemos en vista filtrada)
    const realIdx = window.currentParticipantsData.findIndex(p => p.dni === participant.dni);
    if (realIdx !== -1) {
        window.currentParticipantsData[realIdx][field] = value;
    }

    // Re-renderizar usando la MISMA lista que se estaba viendo
    renderReviewTable(listSource);
}

// Búsqueda remetida a petición del usuario

// Guardar Cambios
document.getElementById('btn-save-participants').addEventListener('click', async () => {
    const btn = document.getElementById('btn-save-participants');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="ph ph-circle-notch ph-spin"></i> Guardando...';
    btn.disabled = true;

    try {
        const { error } = await window.supabaseClient
            .from('participantes')
            .upsert(window.currentParticipantsData, { onConflict: 'dni, evento_id' }); // Usar DNI+Evento como clave de conflicto mas confiable que ID UUID si este ultimo no se cargo bien

        if (error) throw error;

        Swal.fire('Guardado', 'Los datos de los participantes se han actualizado correctamente.', 'success');
        document.getElementById('participant-review-modal').classList.remove('active');

    } catch (err) {
        console.error("Error al guardar:", err);
        Swal.fire('Error', 'No se pudieron guardar los cambios: ' + err.message, 'error');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
});

// --- Lógica del Modal Custom de Borrador de Recordatorio ---

function openReminderDraftModal(eventData, reqData) {
    const modal = document.getElementById('reminder-draft-modal');
    if (!modal) return;

    // Formatear fechas
    let fechasFormateadas = "[Fecha no disponible]";
    const hStr = eventData.horario || '[]';
    const hrs = typeof hStr === 'string' ? JSON.parse(hStr) : hStr;
    const fechasArr = [];
    for (const h of hrs) {
        if (h.fecha) {
            const [yyyy, mm, dd] = h.fecha.split('-');
            let ft = `${dd}/${mm}/${yyyy}`;
            if (h.inicio && h.fin) ft += ` desde las ${h.inicio} hasta las ${h.fin}`;
            else if (h.inicio) ft += ` desde las ${h.inicio}`;
            fechasArr.push(ft);
        }
    }
    if (fechasArr.length > 0) fechasFormateadas = fechasArr.join(', ');

    const linkReunionText = (reqData.prog_zoom_meet && reqData.prog_zoom_meet.trim().length > 0)
        ? `\nEnlace de acceso a la reunión virtual: ${reqData.prog_zoom_meet}\n`
        : (eventData.modalidad === 'Presencial' ? '' : '\n[No se especificó enlace de reunión]\n');

    const emailMap = {
        'Eduardo': 'emamanir@certus.edu.pe',
        'Mirko': 'mnsanchez@certus.edu.pe',
        'José': 'jramirezp@certus.edu.pe',
        'Jorge': 'jdurand@gmail.com',
        'Carlos': 'cybarram@certus.edu.pe',
        'Luis': 'lcondors@certus.edu.pe'
    };
    let userEmail = '';
    if (eventData.responsable) {
        const firstResp = eventData.responsable.split(',')[0].trim();
        userEmail = emailMap[firstResp] || '';
    }

    const draftText = `Estimados participantes,\n\nLes recordamos que están inscritos en el evento ${eventData.tipo} "${eventData.nombre}", el cual se llevará a cabo en las siguientes fechas:\n${fechasFormateadas}\n${linkReunionText}\nPor favor, recuerden ser puntuales.\n\n¡Los esperamos!`;

    // Llenar campos SOLO SI están vacíos (para persistencia)
    const toField = document.getElementById('rem-draft-to');
    const ccField = document.getElementById('rem-draft-cc');
    const subjectField = document.getElementById('rem-draft-subject');
    const textField = document.getElementById('rem-draft-text');

    if (!toField.value) toField.value = userEmail;
    if (!ccField.value) ccField.value = "lhurtadoo@certus.edu.pe, jramirezp@certus.edu.pe";
    if (!subjectField.value) subjectField.value = `Recordatorio del evento: ${eventData.nombre}`;
    if (!textField.value) textField.value = draftText;

    // Configurar botón de revisión
    const btnReview = document.getElementById('btn-open-review-from-draft');
    btnReview.onclick = () => window.openParticipantReviewModal(eventData.id);

    // Asegurar que el modal de revisión esté por encima del borrador
    document.getElementById('participant-review-modal').style.zIndex = "2100";
    modal.style.zIndex = "2000";

    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
}

function closeReminderDraftModal() {
    const modal = document.getElementById('reminder-draft-modal');
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
}

window.openReminderDraftModal = openReminderDraftModal;
window.closeReminderDraftModal = closeReminderDraftModal;

// --- Lógica Borrador Constancias ---

function openCertificatesDraftModal(eventData, reqData) {
    const modal = document.getElementById('certificate-draft-modal');
    if (!modal) return;

    const emailMap = {
        'Eduardo': 'emamanir@certus.edu.pe',
        'Mirko': 'mnsanchez@certus.edu.pe',
        'José': 'jramirezp@certus.edu.pe',
        'Jorge': 'jdurand@gmail.com',
        'Carlos': 'cybarram@certus.edu.pe',
        'Luis': 'lcondors@certus.edu.pe'
    };
    let userEmail = '';
    if (eventData.responsable) {
        const firstResp = eventData.responsable.split(',')[0].trim();
        userEmail = emailMap[firstResp] || '';
    }

    const draftText = `Estimados participantes,\n\nEs un gusto saludarles. Les hacemos entrega de su constancia de participación por haber asistido al evento "${eventData.nombre}".\n\nPueden descargar su certificado en el siguiente enlace:\n[Enlace a carpeta de certificados o portal]\n\n¡Gracias por su participación!`;

    // Llenar campos
    const toField = document.getElementById('cert-draft-to');
    const ccField = document.getElementById('cert-draft-cc');
    const subjectField = document.getElementById('cert-draft-subject');
    const textField = document.getElementById('cert-draft-text');

    if (!toField.value) toField.value = userEmail;
    if (!ccField.value) ccField.value = "lhurtadoo@certus.edu.pe, jramirezp@certus.edu.pe";
    if (!subjectField.value) subjectField.value = `Constancia de Participación: ${eventData.nombre}`;
    if (!textField.value) textField.value = draftText;

    // Configurar botón de revisión
    const btnReview = document.getElementById('btn-open-review-from-cert');
    btnReview.onclick = () => window.openParticipantReviewModal(eventData.id);

    // Z-Index
    document.getElementById('participant-review-modal').style.zIndex = "2100";
    modal.style.zIndex = "2000";

    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
}

function closeCertificatesDraftModal() {
    const modal = document.getElementById('certificate-draft-modal');
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
}

function copyCertificatesDraft() {
    const to = document.getElementById('cert-draft-to').value;
    const cc = document.getElementById('cert-draft-cc').value;
    const cco = document.getElementById('cert-draft-cco').value;
    const subject = document.getElementById('cert-draft-subject').value;
    const body = document.getElementById('cert-draft-text').value;

    const fullText = `PARA: ${to}\nCC: ${cc}\nCCO: ${cco}\nASUNTO: ${subject}\n\n${body}`;

    navigator.clipboard.writeText(fullText).then(() => {
        Swal.fire('Copiado', 'Información de constancias copiada.', 'success');
    });
}

window.openCertificatesDraftModal = openCertificatesDraftModal;
window.closeCertificatesDraftModal = closeCertificatesDraftModal;
window.copyCertificatesDraft = copyCertificatesDraft;

// --- Fin Lógica Borrador ---

window.openParticipantReviewModal = openParticipantReviewModal;
window.toggleSelectAllParticipants = toggleSelectAllParticipants;
window.toggleParticipantSelection = toggleParticipantSelection;
window.deleteSingleParticipant = deleteSingleParticipant;
window.deleteSelectedParticipants = deleteSelectedParticipants;
window.addParticipantsToDraft = addParticipantsToDraft;
window.copyReminderDraft = copyReminderDraft;

window.addEventListener('click', (e) => {
    const modal = document.getElementById('status-modal');
    if (e.target === modal) {
        modal.classList.remove('active');
    }
    const reviewModal = document.getElementById('participant-review-modal');
    if (e.target === reviewModal) {
        reviewModal.classList.remove('active');
        reviewModal.setAttribute('aria-hidden', 'true');
        // No restaurar aria-hidden del app-container si el borrador está abierto
        if (!document.getElementById('reminder-draft-modal').classList.contains('active')) {
            document.querySelector('.app-container')?.setAttribute('aria-hidden', 'false');
        }
    }
    const draftModal = document.getElementById('reminder-draft-modal');
    if (e.target === draftModal) {
        closeReminderDraftModal();
    }
    const certModal = document.getElementById('certificate-draft-modal');
    if (e.target === certModal) {
        closeCertificatesDraftModal();
    }
});

function closeParticipantReviewModal() {
    const modal = document.getElementById('participant-review-modal');
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    // Restaurar acceso al contenedor principal SOLO SI NO hay otros modales abiertos
    if (!document.getElementById('reminder-draft-modal').classList.contains('active') &&
        !document.getElementById('status-modal').classList.contains('active')) {
        document.querySelector('.app-container')?.setAttribute('aria-hidden', 'false');
    }
}
window.closeParticipantReviewModal = closeParticipantReviewModal;

