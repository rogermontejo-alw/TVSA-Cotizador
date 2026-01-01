/**
 * Utilidades de fecha para asegurar la precisión corporativa en la zona horaria de Mérida (UTC-6).
 * Previene el "Efecto Año Nuevo" y otros desfases de servidor.
 */

const MERIDA_OFFSET = "-06:00";

/**
 * Ajusta una cadena de fecha (YYYY-MM-DD o YYYY-MM-DDTHH:mm) para que incluya 
 * explícitamente el offset de Mérida antes de enviarla a la base de datos.
 */
export const formatToMeridaISO = (dateStr) => {
    if (!dateStr) return null;

    // Si ya tiene un offset o es ISO completa, no tocar
    if (dateStr.includes('Z') || dateStr.match(/[+-]\d{2}:\d{2}$/)) {
        return dateStr;
    }

    // Si es solo fecha (YYYY-MM-DD), agregar el inicio del día en Mérida
    if (dateStr.length === 10) {
        return `${dateStr}T00:00:00${MERIDA_OFFSET}`;
    }

    // Si es datetime-local (YYYY-MM-DDTHH:mm), agregar segundos y offset
    if (dateStr.length === 16 || dateStr.length === 19) {
        const base = dateStr.length === 16 ? `${dateStr}:00` : dateStr;
        return `${base}${MERIDA_OFFSET}`;
    }

    return dateStr;
};

/**
 * Obtiene la fecha actual en Mérida formateada para inputs (YYYY-MM-DD o YYYY-MM-DDTHH:mm)
 */
export const getMeridaNowRaw = (includeTime = false) => {
    const d = new Date();
    const meridaDate = new Date(d.toLocaleString("en-US", { timeZone: "America/Merida" }));

    const y = meridaDate.getFullYear();
    const m = String(meridaDate.getMonth() + 1).padStart(2, '0');
    const day = String(meridaDate.getDate()).padStart(2, '0');
    const hh = String(meridaDate.getHours()).padStart(2, '0');
    const mm = String(meridaDate.getMinutes()).padStart(2, '0');

    if (includeTime) return `${y}-${m}-${day}T${hh}:${mm}`;
    return `${y}-${m}-${day}`;
};
