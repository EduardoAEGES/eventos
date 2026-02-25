/**
 * ==== CÓDIGO GOOGLE APPS SCRIPT: Sincronización Unidireccional en Tiempo Real ====
 * 
 * INSTRUCCIONES:
 * 1. En tu Google Sheets ve a: Extensiones > Apps Script.
 * 2. Pega todo este código ahí y reemplaza las 2 llaves de SUPABASE abajo.
 * 3. Guarda (Ctrl+S).
 * 4. Para conectar la Web a este Excel: Arriba a la derecha dale a "Implementar" -> "Nueva Implementación".
 *    Selecciona "Aplicación Web". Ejecutar como: Tú. Acceso: "Cualquier persona".
 * 5. Copia esa "URL de Aplicación Web" generada y úsala en tu WebApp.
 */

const SUPABASE_URL = "https://klmjmlhwuzhymrplemgw.supabase.co"; // REEMPLAZAR
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtsbWptbGh3dXpoeW1ycGxlbWd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1OTMyNjQsImV4cCI6MjA4NzE2OTI2NH0.xFWMvUJa9n9TBcBG1WSeqCGWBaCAtCU9aY7GXk4W6E"; // REEMPLAZAR

// Función auxiliar SÓLO para forzar la ventana de permisos de Google Drive y Forms al ejecutarla manualmente.
function setupPermissions() {
    // Forzar permisos de Google Drive
    const tempFolder = DriveApp.createFolder("Temp_Aut_Borrar");

    // Forzar permisos de Google Forms
    const tempForm = FormApp.create("Temp_Aut_Borrar_Form");
    const formFile = DriveApp.getFileById(tempForm.getId());

    // Borrar basura temporal
    formFile.setTrashed(true);
    tempFolder.setTrashed(true);

    console.log("Permisos de Drive y Forms concedidos correctamente. Ya puedes usar el Webhook.");
}

// Manejar peticiones preflight CORS del navegador
function doOptions(e) {
    const headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PUT, DELETE",
        "Access-Control-Allow-Headers": "Content-Type"
    };
    return ContentService.createTextOutput("")
        .setMimeType(ContentService.MimeType.TEXT);
}

const GOOGLE_SHEET_ID = "1p34BL8wZua7Pv4G362HTZUkAVGc_s-1w7HMceZa61T8"; // ID extraído de tu enlace de Google Sheets

// Buscador y traductor de Sedes para la validación de datos de Sheets
function traducirSedes(sedesStr) {
    if (!sedesStr) return "Todas";
    const dict = {
        "AQP": "Sede Arequipa",
        "PRC": "Sede Surco",
        "NOR": "Sede Norte",
        "ATE": "Sede Ate",
        "SJL": "Sede SJL",
        "VES": "Sede Villa"
    };
    // Soporta múltiples sedes separadas por coma
    return sedesStr.toString().split(",")
        .map(s => dict[s.trim()] || s.trim())
        .join(", ");
}

/**
 * RECIBIDOR DE WEBHOOK (POST)
 * Cuando la WebApp crea un evento, envía una petición POST aquí para insertarlo instantáneamente.
 */
function doPost(e) {
    try {
        const input = JSON.parse(e.postData.contents);
        const sheetName = "ACTIVIDADES COTPLN 2026";
        const sheet = SpreadsheetApp.openById(GOOGLE_SHEET_ID).getSheetByName(sheetName);
        if (!sheet) throw new Error("No se encontró la pestaña llamada '" + sheetName + "'. Asegúrate de que no haya cambiado de nombre.");

        if (input && input.action === "crear_evento") {
            const sheetName = "ACTIVIDADES COTPLN 2026";
            const sheet = SpreadsheetApp.openById(GOOGLE_SHEET_ID).getSheetByName(sheetName);
            if (!sheet) throw new Error("No se encontró la pestaña llamada '" + sheetName + "'. Asegúrate de que no haya cambiado de nombre.");

            const ev = input.data;
            const data = sheet.getDataRange().getValues();

            // Buscamos la primera fila REALMENTE vacía basada en la columna E (Actividad/Evento - Columna 5)
            // NUEVA ESTRATEGIA: Buscar desde abajo. Esto ignora las filas vacías ocultas por los filtros de Excel en medio de la tabla.
            let lastRealRow = data.length;
            while (lastRealRow > 0) {
                let cellVal = data[lastRealRow - 1][4];
                if (cellVal !== undefined && cellVal.toString().trim() !== "") {
                    break;
                }
                lastRealRow--;
            }
            const insertRow = lastRealRow + 1;

            // Conservar estrictamente la descripción enviada desde el formulario web
            let descGen = ev.descripcion || "";

            const newRowData = [
                ev.mes ? ev.mes.toUpperCase() : "", // Mes (A) force Mayus
                ev.fecha_inicio || "", // Inicio (B)
                ev.fecha_fin || "", // Fin (C)
                ev.hora || "", // Hora (D)
                ev.nombre || "", // Actividad / Evento (E)
                ev.descripcion || "", // Descripción breve (F) - Literal desde WebApp
                "Finanzas", // Vertical (G)
                ev.audiencia || "", // Público Objetivo (H) - Literal desde WebApp
                ev.modalidad || "Virtual", // Modalidad (I)
                traducirSedes(ev.sedes), // Sede/Ubicación (J) Traducida
                ev.responsable || "", // Responsables (K)
                "0/7 En proyecto", // Status (L) exact
                ev.sheet_id, // Id (M)
                ev.updated_at || new Date().toISOString(), // Columna N (14)
                ev.is_public ? true : false // Columna O (15) ¿Informar a Marca?
            ];

            sheet.getRange(insertRow, 1, 1, newRowData.length).setValues([newRowData]);

            return ContentService.createTextOutput(JSON.stringify({ "status": "ok", "message": "Guardado en Sheets exitosamente en la fila " + insertRow }))
                .setMimeType(ContentService.MimeType.JSON);
        } else if (input && input.action === "actualizar_estado") {
            const ev = input.data;
            const data = sheet.getDataRange().getValues();
            let targetRow = -1;

            // Intento 1: Por ID
            for (let r = 1; r < data.length; r++) {
                if (data[r][12] && ev.sheet_id && data[r][12].toString().trim() === ev.sheet_id.toString().trim()) {
                    targetRow = r + 1; // 1-based index for getRange
                    break;
                }
            }

            // Intento 2: Fallback por Nombre
            if (targetRow === -1 && ev.nombre) {
                for (let r = 1; r < data.length; r++) {
                    if (data[r][4] && data[r][4].toString().trim() === ev.nombre.toString().trim()) {
                        targetRow = r + 1;
                        if (ev.sheet_id) sheet.getRange(targetRow, 13).setValue(ev.sheet_id); // Auto repare ID
                        break;
                    }
                }
            }

            if (targetRow > -1) {
                const decodStatus = {
                    0: "En proyecto", 1: "Planificado", 2: "Formalizado",
                    3: "Comunicado", 4: "Difundido", 5: "Preparado",
                    6: "Realizado", 7: "Concluido"
                };
                let sId = ev.status !== undefined ? ev.status : 0;
                let sTexto = decodStatus[sId] || "Desconocido";
                const nuevoEstado = sId + "/7 " + sTexto;
                const est_especial = ev.estado_especial ? ev.estado_especial.charAt(0).toUpperCase() + ev.estado_especial.slice(1).toLowerCase() : "";

                sheet.getRange(targetRow, 12).setValue(nuevoEstado + (est_especial ? " " + est_especial : ""));

                // Actualizar timestamp
                sheet.getRange(targetRow, 14).setValue(new Date().toISOString());

                return ContentService.createTextOutput(JSON.stringify({ "status": "ok", "message": "Estado actualizado exitosamente en Sheets" }))
                    .setMimeType(ContentService.MimeType.JSON);
            } else {
                return ContentService.createTextOutput(JSON.stringify({ "error": "Evento no encontrado en Sheets" }))
                    .setMimeType(ContentService.MimeType.JSON);
            }
        } else if (input && input.action === "actualizar_evento") {
            const ev = input.data;
            const data = sheet.getDataRange().getValues();
            let targetRow = -1;

            // Intento 1: Por ID
            for (let r = 1; r < data.length; r++) {
                if (data[r][12] && ev.sheet_id && data[r][12].toString().trim() === ev.sheet_id.toString().trim()) {
                    targetRow = r + 1; // 1-based index for getRange
                    break;
                }
            }

            // Intento 2: Fallback por Nombre
            if (targetRow === -1 && ev.nombre) {
                for (let r = 1; r < data.length; r++) {
                    if (data[r][4] && data[r][4].toString().trim() === ev.nombre.toString().trim()) {
                        targetRow = r + 1;
                        if (ev.sheet_id) sheet.getRange(targetRow, 13).setValue(ev.sheet_id); // Auto repare ID
                        break;
                    }
                }
            }

            if (targetRow > -1) {
                // Conservar valores que no cambian como Estado, Timestamp actualizando lo demás
                const values = [[
                    ev.mes ? ev.mes.toUpperCase() : sheet.getRange(targetRow, 1).getValue(),
                    ev.fecha_inicio || sheet.getRange(targetRow, 2).getValue(),
                    ev.fecha_fin || sheet.getRange(targetRow, 3).getValue(),
                    ev.hora || sheet.getRange(targetRow, 4).getValue(),
                    ev.nombre || "",
                    ev.descripcion || "", // Descripción breve - Literal desde WebApp
                    sheet.getRange(targetRow, 7).getValue(), // Vertical 
                    ev.audiencia || "", // Público Objetivo Literal
                    ev.modalidad || "Virtual",
                    traducirSedes(ev.sedes),
                    ev.responsable || "",
                    sheet.getRange(targetRow, 12).getValue(), // Status old
                    ev.sheet_id,
                    new Date().toISOString(),
                    ev.is_public !== undefined ? ev.is_public : sheet.getRange(targetRow, 15).getValue() // Columna O
                ]];

                sheet.getRange(targetRow, 1, 1, 15).setValues(values);

                return ContentService.createTextOutput(JSON.stringify({ "status": "ok", "message": "Evento actualizado exitosamente en Sheets" }))
                    .setMimeType(ContentService.MimeType.JSON);
            } else {
                return ContentService.createTextOutput(JSON.stringify({ "error": "Evento no encontrado para actualizar" }))
                    .setMimeType(ContentService.MimeType.JSON);
            }
        } else if (input && input.action === "eliminar_evento") {
            const ev = input.data;
            const data = sheet.getDataRange().getValues();
            let targetRow = -1;

            // Intento 1: Por ID
            for (let r = 1; r < data.length; r++) {
                if (data[r][12] && ev.sheet_id && data[r][12].toString().trim() === ev.sheet_id.toString().trim()) {
                    targetRow = r + 1;
                    break;
                }
            }

            // Intento 2: Fallback por Nombre
            if (targetRow === -1 && ev.nombre) {
                for (let r = 1; r < data.length; r++) {
                    if (data[r][4] && data[r][4].toString().trim() === ev.nombre.toString().trim()) {
                        targetRow = r + 1;
                        break; // No auto-reparamos ID aquí porque lo vamos a borrar
                    }
                }
            }

            if (targetRow > -1) {
                sheet.deleteRow(targetRow);
                return ContentService.createTextOutput(JSON.stringify({ "status": "ok", "message": "Evento eliminado exitosamente de Sheets" }))
                    .setMimeType(ContentService.MimeType.JSON);
            } else {
                return ContentService.createTextOutput(JSON.stringify({ "error": "Evento no encontrado para eliminar" }))
                    .setMimeType(ContentService.MimeType.JSON);
            }

        } else if (input && input.action === "crear_carpeta_evento") {
            const ev = input.data; // Needs: folder_name
            const parentFolderId = "1nyN81gZicYLBW6RyEHb_wZmEQoyqutps";

            if (!ev || !ev.folder_name) {
                return ContentService.createTextOutput(JSON.stringify({ "error": "Falta el nombre de la carpeta (folder_name)" }))
                    .setMimeType(ContentService.MimeType.JSON);
            }

            try {
                const parentFolder = DriveApp.getFolderById(parentFolderId);
                const folders = parentFolder.getFoldersByName(ev.folder_name);

                let eventFolder;
                if (folders.hasNext()) {
                    // Folder already exists, just return it
                    eventFolder = folders.next();
                } else {
                    // Create new folder
                    eventFolder = parentFolder.createFolder(ev.folder_name);
                    // Create subfolder 'Constancias' inside it
                    eventFolder.createFolder("Constancias");

                    // --- CREACIÓN AUTOMÁTICA DE FORMULARIOS ---
                    try {
                        const eventNameTitle = ev.event_name || ev.folder_name.replace(/^[0-9\/]+ /, '');
                        const dateStr = ev.event_horario_str || "la fecha y hora programada";

                        // 1. Buscar el banner de imagen en Drive (Debe llamarse exactamente "Wallpaper certus.jpg")
                        let bannerBlob = null;
                        const imageFiles = DriveApp.getFilesByName("Wallpaper certus.jpg");
                        if (imageFiles.hasNext()) {
                            bannerBlob = imageFiles.next().getBlob();
                        }

                        // ========== FORMULARIO DE INSCRIPCIÓN ==========
                        const formInscripcion = FormApp.create("INSCRIPCION AL TALLER VIRTUAL: " + eventNameTitle);
                        DriveApp.getFileById(formInscripcion.getId()).moveTo(eventFolder);

                        // Intentar aplicar la imagen al Formulario 1
                        if (bannerBlob) {
                            try {
                                formInscripcion.setCustomBanner(bannerBlob);
                            } catch (bannerErr1) {
                                console.log("Advertencia: No se pudo aplicar el banner al Form 1: " + bannerErr1.message);
                            }
                        }

                        formInscripcion.setDescription("Estimad@ Estudiante:\nQueremos invitarte al Taller virtual que se realizará el día " + dateStr + ".\n\nImportante:\n1. Completa el presente formulario de inscripción verificando que tus datos estén correctos.\n2. Una vez inscrito, te enviaremos a tu correo un recordatorio para la asistencia de este evento\n\n¡Te esperamos!");

                        formInscripcion.addTextItem().setTitle('Nombres:').setRequired(true);
                        formInscripcion.addTextItem().setTitle('Apellidos:').setRequired(true);
                        formInscripcion.addTextItem().setTitle('DNI:').setRequired(true);
                        formInscripcion.addMultipleChoiceItem()
                            .setTitle('Usted como parte de la familia CERTUS es:')
                            .setChoiceValues(['DOCENTE', 'ESTUDIANTE', 'EGRESADO'])
                            .setRequired(true);
                        formInscripcion.addTextItem()
                            .setTitle('Correo electrónico (Coloca el correo institucional de Certus, ejemplo: DNI@certus.edu.pe)')
                            .setRequired(true);
                        formInscripcion.addTextItem()
                            .setTitle('Número del celular activo (Nos comunicaremos a este número)')
                            .setRequired(true);
                        formInscripcion.addMultipleChoiceItem()
                            .setTitle('Ciclo:')
                            .setChoiceValues(['I Ciclo', 'II Ciclo', 'III Ciclo', 'IV Ciclo', 'V Ciclo', 'VI Ciclo', 'Docente', 'Egresado'])
                            .setRequired(true);
                        formInscripcion.addMultipleChoiceItem()
                            .setTitle('Turno:')
                            .setChoiceValues(['Mañana', 'Diurno', 'Tarde', 'Noche', 'Egresado'])
                            .setRequired(true);

                        // ========== FORMULARIO DE ASISTENCIA ==========
                        const formAsistencia = FormApp.create("ASISTENCIA AL TALLER: " + eventNameTitle);
                        DriveApp.getFileById(formAsistencia.getId()).moveTo(eventFolder);

                        // Intentar aplicar la imagen al Formulario 2
                        if (bannerBlob) {
                            try {
                                formAsistencia.setCustomBanner(bannerBlob);
                            } catch (bannerErr2) {
                                console.log("Advertencia: No se pudo aplicar el banner al Form 2: " + bannerErr2.message);
                            }
                        }

                        formAsistencia.setDescription("Muchas gracias por participar en el taller el día " + dateStr + ".\nPor favor, registre su asistencia para la emisión de su respectiva constancia.");

                        formAsistencia.addTextItem().setTitle('DNI:').setRequired(true);
                        formAsistencia.addTextItem().setTitle('Apellidos y Nombres completos:').setRequired(true);
                        formAsistencia.addTextItem()
                            .setTitle('Correo electrónico (Institucional o personal)')
                            .setRequired(true);

                        // Feedback corto
                        formAsistencia.addScaleItem()
                            .setTitle('Feedback: ¿Qué tan satisfecho se encuentra con el Taller impartido el día de hoy?')
                            .setBounds(1, 5)
                            .setLabels("Nada satisfecho", "Muy satisfecho")
                            .setRequired(true);

                        formAsistencia.addParagraphTextItem()
                            .setTitle('¿Desea contarnos más? ¿Por qué eligió esa calificación? (Opcional)')
                            .setRequired(false);

                    } catch (formErr) {
                        // Ignoramos errores del formulario para no interrumpir el flujo principal del Webhook
                        console.log("Error creando formularios: " + formErr.message);
                    }
                    // --- FIN CREACIÓN AUTOMÁTICA DE FORMULARIO ---
                }

                return ContentService.createTextOutput(JSON.stringify({
                    "status": "ok",
                    "folder_url": eventFolder.getUrl()
                })).setMimeType(ContentService.MimeType.JSON);

            } catch (folderErr) {
                return ContentService.createTextOutput(JSON.stringify({ "error": "Error de Drive: " + folderErr.message }))
                    .setMimeType(ContentService.MimeType.JSON);
            }
        } else if (input && input.action === "verificar_carpeta_evento") {
            const ev = input.data;
            if (!ev || !ev.folder_url) {
                return ContentService.createTextOutput(JSON.stringify({ "error": "Falta folder_url", "exists": false }))
                    .setMimeType(ContentService.MimeType.JSON);
            }

            try {
                // Extraer el ID de la URL
                const match = ev.folder_url.match(/folders\/([a-zA-Z0-9_-]+)/);
                const folderId = match ? match[1] : ev.folder_url;

                const f = DriveApp.getFolderById(folderId);
                const exists = !f.isTrashed();

                return ContentService.createTextOutput(JSON.stringify({ "status": "ok", "exists": exists }))
                    .setMimeType(ContentService.MimeType.JSON);
            } catch (folderErr) {
                // If getFolderById throws an error, the folder doesn't exist or is inaccessible
                return ContentService.createTextOutput(JSON.stringify({ "status": "ok", "exists": false }))
                    .setMimeType(ContentService.MimeType.JSON);
            }
        }
    } catch (err) {
        return ContentService.createTextOutput(JSON.stringify({ "error": err.message }))
            .setMimeType(ContentService.MimeType.JSON);
    }
}
