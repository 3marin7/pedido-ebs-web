export const TIMEZONE_BOGOTA = 'America/Bogota';

export const parseDateLocal = (value) => {
  if (!value) return null;

  if (typeof value === 'string') {
    const fechaTexto = value.trim();
    const match = fechaTexto.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match) {
      const [, year, month, day] = match;
      return new Date(Number(year), Number(month) - 1, Number(day), 0, 0, 0, 0);
    }
  }

  const fecha = new Date(value);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
};

export const formatDateBogota = (
  value,
  locale = 'es-CO',
  options = { year: 'numeric', month: 'short', day: 'numeric' }
) => {
  const fecha = parseDateLocal(value);
  return fecha ? fecha.toLocaleDateString(locale, { ...options, timeZone: TIMEZONE_BOGOTA }) : '';
};

export const formatDateLocal = formatDateBogota;

export const formatDateTimeBogota = (
  value,
  locale = 'es-CO',
  options = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }
) => {
  const fecha = parseDateLocal(value);
  return fecha ? fecha.toLocaleString(locale, { ...options, timeZone: TIMEZONE_BOGOTA }) : '';
};

export const formatInputDateLocal = (value = new Date()) => {
  const fecha = typeof value === 'string' ? parseDateLocal(value) : value;
  if (!(fecha instanceof Date) || Number.isNaN(fecha.getTime())) return '';

  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, '0');
  const day = String(fecha.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

export const nowLocalIsoDate = () => formatInputDateLocal(new Date());
