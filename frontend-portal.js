/* frontend-portal.js */

// --- CONFIGURACIÓN DE SUPABASE ---
const SUPABASE_URL = 'https://klmjmlhwuzhymrplemgw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtsbWptbGh3dXpoeW1ycGxlbWd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1OTMyNjQsImV4cCI6MjA4NzE2OTI2NH0.xFWMvUJa9n9TBcBG1WSeqCGiWBaCAtCU9aY7GXk4W6E';

const supabasePortal = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('search-form');
    const inputDni = document.getElementById('dni-input');
    const btnSearch = document.getElementById('btn-search');
    const errorMsg = document.getElementById('error-message');
    const loadingSpinner = document.getElementById('loading-spinner');
    const resultsContainer = document.getElementById('results-container');
    const certGrid = document.getElementById('cert-grid');
    const studentNameTitle = document.getElementById('student-name');

    function wrapTextCanvas(ctx, text, x, y, maxWidth, lineHeight) {
        const words = text.split(' ');
        let line = '';
        const lines = [];

        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;
            if (testWidth > maxWidth && n > 0) {
                lines.push(line.trim());
                line = words[n] + ' ';
            } else {
                line = testLine;
            }
        }
        lines.push(line.trim());

        for (let k = 0; k < lines.length; k++) {
            ctx.fillText(lines[k], x, y + (k * lineHeight));
        }
        return lines.length;
    }

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
        document.getElementById('viewer-section').style.display = 'none';
        const previewImg = document.getElementById('cert-preview-img');
        if (previewImg) previewImg.src = '';

        // Loading State
        btnSearch.disabled = true;
        btnSearch.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Buscando...';
        loadingSpinner.style.display = 'block';

        try {
            // Query Supabase
            // We need to join the 'eventos' table to get the event name and details
            const { data, error } = await supabasePortal
                .from('asistencias')
                .select(`
                    id, 
                    dni,
                    nombres, 
                    apellidos,
                    asistencia,
                    certificado_autorizado,
                    certificado_url,
                    eventos (
                        id,
                        nombre,
                        tipo,
                        modalidad,
                        horario
                    )
                `)
                .eq('dni', dni)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Filtrar por asistencia y autorización (solo mostrar si asistió y está autorizado por el admin)
            const attendedRecords = (data || []).filter(item => item.asistencia === true && item.certificado_autorizado === true);

            if (attendedRecords.length === 0) {
                showError(`No se encontraron constancias de asistencia para el DNI: ${dni}.`);
                return;
            }

            // Success - Render Data
            const studentName = `${attendedRecords[0].nombres} ${attendedRecords[0].apellidos || ''}`.trim();
            studentNameTitle.textContent = studentName;

            attendedRecords.forEach((item, index) => {
                const ev = item.eventos;
                if (!ev) return;

                // Extract Date from JSON schedule
                let dateStr = "Fecha no disponible";
                try {
                    const hs = JSON.parse(ev.horario || '[]');
                    if (hs.length > 0 && hs[0].fecha) {
                        const [y, m, d] = hs[0].fecha.split('-');
                        dateStr = `${d}/${m}/${y}`;
                    }
                } catch (e) { }

                // Build Card
                const card = document.createElement('div');
                card.className = 'cert-card';
                card.innerHTML = `
                    <div class="cert-type">${ev.tipo || 'Evento Académico'}</div>
                    <div class="cert-event">${ev.nombre.length > 50 ? ev.nombre.substring(0, 47) + '...' : ev.nombre}</div>
                    <div class="cert-meta">
                        <span><i class="ph ph-calendar-blank"></i> ${dateStr}</span>
                        <span><i class="ph ph-map-pin"></i> ${ev.modalidad || 'N/A'}</span>
                    </div>
                `;

                // Card Click Event
                card.onclick = () => {
                    // Update Active Class
                    document.querySelectorAll('.cert-card').forEach(c => c.classList.remove('active'));
                    card.classList.add('active');

                    // Show Viewer
                    showCertificate(item);
                };

                certGrid.appendChild(card);

                // Auto-select first one
                if (index === 0) {
                    card.click();
                }
            });

            resultsContainer.style.display = 'block';

        } catch (err) {
            console.error("Error Fetching Data: ", err);
            showError('Hubo un error al conectar con la base de datos.');
        } finally {
            // Restore Button
            btnSearch.disabled = false;
            btnSearch.innerHTML = '<i class="ph ph-magnifying-glass"></i> Buscar Certificados';
            loadingSpinner.style.display = 'none';
        }
    }

    async function createCertificatePDF(item, canvas) {
        const { jsPDF } = window.jspdf;
        const ev = item.eventos;

        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'px',
            format: [1123, 794]
        });

        if (canvas) {
            const imgData = canvas.toDataURL('image/png', 1.0);
            pdf.addImage(imgData, 'PNG', 0, 0, 1123, 794, undefined, 'FAST');
            return pdf;
        }

        // Fallback (older manual logic if no canvas provided, though we will aim to always provide one)
        // [Existing manual drawing logic can remain here as fallback or be simplified]
        return new Promise((resolve) => {
            const img = new Image();
            img.src = 'constancia_base.png';
            img.onload = () => {
                pdf.addImage(img, 'PNG', 0, 0, 1123, 794);
                // ... (simplified or kept as is)
                // To guarantee identity, we prefer the canvas approach.
                // Let's call renderToImage internally if needed or just use the canvas.
                resolve(pdf);
            };
        });
    }

    async function generateAndDownloadLocal(item) {
        const canvas = document.getElementById('cert-canvas');
        await renderCertificateToImage(item); 
        const pdf = await createCertificatePDF(item, canvas);
        const eventId = new URLSearchParams(window.location.search).get('id') || '000';
        pdf.save(`Constancia_${item.dni}_${eventId.padStart(3, '0')}.pdf`);
    }


    async function renderCertificateToImage(item) {
        const canvas = document.getElementById('cert-canvas');
        const previewImg = document.getElementById('cert-preview-img');
        if (!canvas || !previewImg) return;

        const ctx = canvas.getContext('2d');
        canvas.width = 1123;
        canvas.height = 794;

        const ev = item.eventos || {};
        let inicioStr = '';
        let lastDateObj = new Date();
        try {
            const horarios = JSON.parse(ev.horario || '[]');
            if (horarios.length > 0) {
                horarios.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
                const first = new Date(horarios[0].fecha + "T00:00:00");
                const last = new Date(horarios[horarios.length - 1].fecha + "T00:00:00");
                lastDateObj = last;
                const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
                if (horarios.length === 1 || first.getTime() === last.getTime()) {
                    inicioStr = `${first.getDate()} de ${months[first.getMonth()]} de ${first.getFullYear()}`;
                } else if (first.getMonth() === last.getMonth()) {
                    inicioStr = `${first.getDate()} al ${last.getDate()} de ${months[first.getMonth()]} de ${first.getFullYear()}`;
                } else {
                    inicioStr = `${first.getDate()} de ${months[first.getMonth()]} al ${last.getDate()} de ${months[last.getMonth()]} de ${first.getFullYear()}`;
                }
            }
        } catch (e) { }

        const firmaDate = new Date(lastDateObj);
        firmaDate.setDate(firmaDate.getDate() + 1);
        const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
        const firmaStr = `${firmaDate.getDate()} de ${months[firmaDate.getMonth()]} de ${firmaDate.getFullYear()}`;

        const baseImg = new Image();
        baseImg.src = 'constancia_base.png';
        return new Promise((resolve) => {
            baseImg.onload = () => {
                ctx.drawImage(baseImg, 0, 0, 1123, 794);

                // 1. "CONSTANCIA" - Cinzel para elegancia romana/profesional
                ctx.fillStyle = '#002d5c';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.font = '800 68px Cinzel, serif';
                ctx.fillText("CONSTANCIA", 561, 150);

                // 2. "otorgada a:" - Libre Baskerville itálica
                ctx.font = 'italic 20px "Libre Baskerville", serif';
                ctx.fillStyle = '#334155';
                ctx.fillText("otorgada a:", 561, 195);

                // 3. Apellidos y Nombres - Playfair Display Bold with scaling
                const fullName = `${(item.apellidos || '').toUpperCase()} ${(item.nombres || '').toUpperCase()}`.trim();
                ctx.font = '800 32px "Outfit", sans-serif'; 
                ctx.fillStyle = '#002d5c';
                ctx.fillText(fullName, 561, 260);

                // 3.5 Línea decorativa con Graduado (Efecto degradado en los extremos)
                const gradient = ctx.createLinearGradient(150, 0, 973, 0);
                gradient.addColorStop(0, 'rgba(0, 45, 92, 0)');
                gradient.addColorStop(0.2, 'rgba(0, 45, 92, 0.8)');
                gradient.addColorStop(0.8, 'rgba(0, 45, 92, 0.8)');
                gradient.addColorStop(1, 'rgba(0, 45, 92, 0)');

                ctx.strokeStyle = gradient;
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(200, 290);
                ctx.lineTo(923, 290);
                ctx.stroke();

                // Línea ultra-fina secundaria para elegancia
                ctx.lineWidth = 0.4;
                ctx.beginPath();
                ctx.moveTo(150, 295);
                ctx.lineTo(973, 295);
                ctx.stroke();

                // 4. "Por participar en..." - Outfit Clean
                ctx.font = '22px Outfit, sans-serif';
                ctx.fillStyle = '#1e293b';

                const type = (ev.tipo || 'webinar').toLowerCase();
                let article = 'el';
                if (type.includes('apertura') || type.includes('reunión') || type.includes('clase') || type.includes('sesión')) article = 'la';

                ctx.font = '400 20px Outfit, sans-serif';
                ctx.fillText(`Por participar en ${article} ${type}`, 561, 335);

                // 5. Nombre del Evento - Outfit Bold con multilínea
                ctx.font = 'bold 28px Outfit, sans-serif'; // Reducido de 36 a 28
                ctx.fillStyle = '#002d5c';
                const eventTitle = (ev.nombre || '').toUpperCase();
                const maxTitleWidth = 850;
                
                const lineCount = wrapTextCanvas(ctx, eventTitle, 561, 375, maxTitleWidth, 32); // leading reducido de 40 a 32
                const titleExtraHeight = (lineCount - 1) * 32;

                // 6. Texto legal - Outfit
                ctx.font = '16px Outfit, sans-serif'; // Reducido de 18 a 16
                ctx.fillStyle = '#334155';
                ctx.fillText(`organizado por la Dirección Académica de la Escuela de Educación Superior`, 561, 420 + titleExtraHeight);
                ctx.fillText(`CERTUS, que se realizó el ${inicioStr}.`, 561, 442 + titleExtraHeight);

                // 7. Fecha de firma - Libre Baskerville
                ctx.font = 'italic 16px "Libre Baskerville", serif'; // Reducido de 18 a 16
                ctx.fillStyle = '#475569';
                ctx.fillText(`Lima, ${firmaStr}`, 561, 495 + titleExtraHeight);

                // 8. Folio - Mono/Roboto
                ctx.font = '11px "Inter", sans-serif';
                ctx.fillStyle = '#94a3b8';
                ctx.textAlign = 'left';
                const typePrefixes = { 'Webinar': 'WBN', 'Taller': 'TLR', 'Apertura Académica': 'APR', 'Curso': 'CUR' };
                const prefix = typePrefixes[ev.tipo] || 'EVT';
                const regCode = `Folio N°: ${prefix}-${String(ev.id).padStart(4, '0')}-${item.dni || '00000000'}`;
                ctx.textAlign = 'left'; 
                ctx.fillText(regCode, 45, 765);

                previewImg.src = canvas.toDataURL('image/png');
                resolve();
            };
        });
    }

    async function showCertificate(item) {
        const viewerSection = document.getElementById('viewer-section');
        const downloadLink = document.getElementById('btn-download-link');

        viewerSection.style.display = 'block';
        window.currentParticipantItem = item;

        // Render preview image via Canvas
        await renderCertificateToImage(item);

        // Configure download button
        downloadLink.onclick = async (e) => {
            e.preventDefault();
            const it = window.currentParticipantItem;
            if (it && it.certificado_url) {
                window.open(it.certificado_url, '_blank');
            } else {
                await generateAndDownloadLocal(it);
            }
        };
    }

    function showError(message) {
        errorMsg.textContent = message;
        errorMsg.style.display = 'block';
    }
});
