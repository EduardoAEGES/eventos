/* frontend-portal.js */

// --- CONFIGURACIÓN DE SUPABASE ---
// IMPORTANTE: Reemplaza estos valores con los de tu proyecto Supabase.
// Los encuentras en: Configuración General de Supabase -> API.
const SUPABASE_URL = 'URL_DE_TU_PROYECTO_AQUI';
const SUPABASE_KEY = 'TU_ANON_KEY_AQUI';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('search-form');
    const inputDni = document.getElementById('dni-input');
    const btnSearch = document.getElementById('btn-search');
    const errorMsg = document.getElementById('error-message');
    const loadingSpinner = document.getElementById('loading-spinner');
    const resultsContainer = document.getElementById('results-container');
    const certGrid = document.getElementById('cert-grid');
    const studentNameTitle = document.getElementById('student-name');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const dni = inputDni.value.trim();

        // Strict Validation (only digits, 8 chars typical peruvian DNI but allowing slightly more for flexibility)
        if (!dni || dni.length < 8) {
            showError('Por favor ingrese un número de identidad válido (mínimo 8 dígitos).');
            return;
        }

        searchCertificates(dni);
    });

    async function searchCertificates(dni) {
        // Reset UI
        errorMsg.style.display = 'none';
        resultsContainer.style.display = 'none';
        certGrid.innerHTML = '';

        // Loading State
        btnSearch.disabled = true;
        btnSearch.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Buscando...';
        loadingSpinner.style.display = 'block';

        try {
            // Query Supabase
            // We need to join the 'eventos' table to get the event name and details
            const { data, error } = await supabase
                .from('participantes')
                .select(`
                    id, 
                    nombres, 
                    certificado_url,
                    eventos (
                        nombre,
                        tipo,
                        modalidad,
                        horario
                    )
                `)
                .eq('dni', dni)
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (data.length === 0) {
                showError(`No se encontraron constancias registradas para el DNI: ${dni}. Asegúrese de haber escrito el número correctamente.`);
                return;
            }

            // Success - Render Data
            const studentName = data[0].nombres;
            studentNameTitle.innerHTML = `<i class="ph-fill ph-user-circle" style="color:var(--primary-color)"></i> Bienvenido, ${studentName}`;

            data.forEach(item => {
                const ev = item.eventos;
                if (!ev) return; // DB integrity check

                // Extract Date from JSON schedule
                let dateStr = "Fecha no disponible";
                try {
                    const hs = JSON.parse(ev.horario || '[]');
                    if (hs.length > 0 && hs[0].fecha) dateStr = hs[0].fecha;
                } catch (e) { }

                // Build Card
                const card = document.createElement('div');
                card.className = 'cert-card';

                // Determine button type
                let actionBtn = '';
                if (item.certificado_url) {
                    actionBtn = `<a href="${item.certificado_url}" target="_blank" class="btn-download" title="Abrir y descargar PDF">
                        <i class="ph ph-file-pdf"></i> Descargar PDF
                    </a>`;
                } else {
                    actionBtn = `<div class="btn-pending" title="Su certificado está en proceso de emisión.">
                        <i class="ph ph-clock"></i> En Proceso
                    </div>`;
                }

                card.innerHTML = `
                    <div class="cert-type">${ev.tipo || 'Evento Académico'}</div>
                    <div class="cert-event">${ev.nombre}</div>
                    <div class="cert-meta">
                        <span><i class="ph ph-calendar-blank"></i> ${dateStr}</span>
                        <span><i class="ph ph-users"></i> ${ev.modalidad || 'N/A'}</span>
                    </div>
                    <div class="actions-row">
                        ${actionBtn}
                    </div>
                `;

                certGrid.appendChild(card);
            });

            resultsContainer.style.display = 'block';

        } catch (err) {
            console.error("Error Fetching Data: ", err);
            showError('Hubo un error al conectar con la base de datos. Por favor, intente nuevamente más tarde.');
        } finally {
            // Restore Button
            btnSearch.disabled = false;
            btnSearch.innerHTML = '<i class="ph ph-magnifying-glass"></i> Buscar Certificados';
            loadingSpinner.style.display = 'none';
        }
    }

    function showError(message) {
        errorMsg.textContent = message;
        errorMsg.style.display = 'block';
    }
});
