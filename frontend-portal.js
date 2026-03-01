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
                .from('participantes')
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
                    <div class="cert-event">${ev.nombre}</div>
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

    async function createCertificatePDF(item) {
        const { jsPDF } = window.jspdf;
        const ev = item.eventos;

        // 1. Preparar fechas
        let inicioStr = "";
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

        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'px',
            format: [1123, 794]
        });

        return new Promise((resolve) => {
            const img = new Image();
            img.src = 'constancia_base.png';
            img.onload = () => {
                // 1. "CONSTANCIA"
                pdf.setFont("times", "bold");
                pdf.setFontSize(54);
                pdf.setTextColor(0, 45, 92); // #002d5c
                pdf.text("CONSTANCIA", 561, 190, { align: 'center' });

                // 2. "otorgada a:"
                pdf.setFont("times", "italic");
                pdf.setFontSize(22);
                pdf.setTextColor(51, 65, 85);
                pdf.text("otorgada a:", 561, 240, { align: 'center' });

                // 3. Apellidos y Nombres - Scaling logic for PDF
                const fullName = `${(item.apellidos || '').toUpperCase()} ${(item.nombres || '').toUpperCase()}`.trim();
                let nameFontSize = 40;
                const maxNameWidth = 800; // px
                pdf.setFont("helvetica", "bold");
                let currentWidth = pdf.getTextWidth(fullName);

                if (currentWidth > maxNameWidth) {
                    nameFontSize = Math.floor(nameFontSize * (maxNameWidth / currentWidth));
                }

                pdf.setFontSize(nameFontSize);
                pdf.setTextColor(0, 45, 92);
                pdf.text(fullName, 561, 310, { align: 'center' });

                // 4. Gradient-like Decorative Line below name (simulated in PDF with multiple lines or solid color)
                pdf.setDrawColor(0, 45, 92);
                pdf.setLineWidth(1.5);
                pdf.line(200, 335, 923, 335); // Longer line
                pdf.setDrawColor(0, 45, 92, 0.4);
                pdf.setLineWidth(0.5);
                pdf.line(150, 338, 973, 338); // Even longer secondary thin line

                // 5. Description
                const type = (ev.tipo || 'webinar').toLowerCase();
                let article = 'el';
                if (type.includes('apertura') || type.includes('reunión') || type.includes('clase') || type.includes('sesión')) article = 'la';

                pdf.setFont("helvetica", "normal");
                pdf.setFontSize(20);
                pdf.setTextColor(51, 65, 85);
                pdf.text(`Por participar en ${article} ${type}`, 561, 400, { align: 'center' });

                pdf.setFont("helvetica", "bold");
                pdf.setFontSize(28);
                pdf.setTextColor(0, 45, 92);
                pdf.text((ev.nombre || '').toUpperCase(), 561, 440, { align: 'center' });

                pdf.setFont("helvetica", "normal");
                pdf.setFontSize(16);
                pdf.setTextColor(51, 65, 85);
                pdf.text(`organizado por la Dirección Académica de la Escuela de Educación Superior`, 561, 485, { align: 'center' });
                pdf.text(`CERTUS, que se realizó el ${inicioStr}.`, 561, 510, { align: 'center' });

                // 6. Fecha de firma
                pdf.setFont("times", "normal");
                pdf.setFontSize(18);
                pdf.setTextColor(71, 85, 105);
                pdf.text(`Lima, ${firmaStr}`, 561, 580, { align: 'center' });

                // 7. Folio
                pdf.setFont("helvetica", "normal");
                pdf.setFontSize(10);
                pdf.setTextColor(148, 163, 184);
                const typePrefixes = { 'Webinar': 'WBN', 'Taller': 'TLR', 'Apertura Académica': 'APR', 'Curso': 'CUR' };
                const prefix = typePrefixes[ev.tipo] || 'EVT';
                const regCode = `Folio N°: ${prefix}-${String(ev.id).padStart(4, '0')}-${item.dni || '00000000'}`;
                pdf.text(regCode, 45, 765);

                resolve(pdf);
            };
        });
    }

    async function generateAndDownloadLocal(item) {
        const pdf = await createCertificatePDF(item);
        pdf.save(`Constancia_${item.dni}.pdf`);
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
                ctx.fillText("CONSTANCIA", 561, 190);

                // 2. "otorgada a:" - Libre Baskerville itálica
                ctx.font = 'italic 24px "Libre Baskerville", serif';
                ctx.fillStyle = '#334155';
                ctx.fillText("otorgada a:", 561, 245);

                // 3. Apellidos y Nombres - Playfair Display Bold with scaling
                const fullName = `${(item.apellidos || '').toUpperCase()} ${(item.nombres || '').toUpperCase()}`.trim();
                let baseFontSize = 52;
                ctx.font = `bold ${baseFontSize}px "Playfair Display", serif`;

                // Dynamic scaling
                const maxWidth = 850;
                let textWidth = ctx.measureText(fullName).width;
                if (textWidth > maxWidth) {
                    const newSize = Math.floor(baseFontSize * (maxWidth / textWidth));
                    ctx.font = `bold ${newSize}px "Playfair Display", serif`;
                }

                ctx.fillStyle = '#002d5c';
                ctx.fillText(fullName, 561, 320);

                // 3.5 Línea decorativa con Graduado (Efecto degradado en los extremos)
                const gradient = ctx.createLinearGradient(150, 0, 973, 0);
                gradient.addColorStop(0, 'rgba(0, 45, 92, 0)');
                gradient.addColorStop(0.2, 'rgba(0, 45, 92, 0.8)');
                gradient.addColorStop(0.8, 'rgba(0, 45, 92, 0.8)');
                gradient.addColorStop(1, 'rgba(0, 45, 92, 0)');

                ctx.strokeStyle = gradient;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(150, 355);
                ctx.lineTo(973, 355);
                ctx.stroke();

                // Línea ultra-fina secundaria para elegancia
                ctx.lineWidth = 0.5;
                ctx.beginPath();
                ctx.moveTo(100, 360);
                ctx.lineTo(1023, 360);
                ctx.stroke();

                // 4. "Por participar en..." - Outfit Clean
                ctx.font = '22px Outfit, sans-serif';
                ctx.fillStyle = '#1e293b';

                const type = (ev.tipo || 'webinar').toLowerCase();
                let article = 'el';
                if (type.includes('apertura') || type.includes('reunión') || type.includes('clase') || type.includes('sesión')) article = 'la';

                ctx.fillText(`Por participar en ${article} ${type}`, 561, 415);

                // 5. Nombre del Evento - Outfit Bold
                ctx.font = 'bold 36px Outfit, sans-serif';
                ctx.fillStyle = '#002d5c';
                ctx.fillText((ev.nombre || '').toUpperCase(), 561, 460);

                // 6. Texto legal - Outfit
                ctx.font = '18px Outfit, sans-serif';
                ctx.fillStyle = '#334155';
                ctx.fillText(`organizado por la Dirección Académica de la Escuela de Educación Superior`, 561, 515);
                ctx.fillText(`CERTUS, que se realizó el ${inicioStr}.`, 561, 540);

                // 7. Fecha de firma - Libre Baskerville
                ctx.font = 'italic 18px "Libre Baskerville", serif';
                ctx.fillStyle = '#475569';
                ctx.fillText(`Lima, ${firmaStr}`, 561, 600);

                // 8. Folio - Mono/Roboto
                ctx.font = '11px "Inter", sans-serif';
                ctx.fillStyle = '#94a3b8';
                ctx.textAlign = 'left';
                const typePrefixes = { 'Webinar': 'WBN', 'Taller': 'TLR', 'Apertura Académica': 'APR', 'Curso': 'CUR' };
                const prefix = typePrefixes[ev.tipo] || 'EVT';
                const regCode = `Folio N°: ${prefix}-${String(ev.id).padStart(4, '0')}-${item.dni || '00000000'}`;
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
