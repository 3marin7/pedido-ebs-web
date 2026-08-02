import { parseDateLocal, formatDateLocal, formatInputDateLocal } from '../dateUtils';

describe('dateUtils', () => {
  test('parseDateLocal parses YYYY-MM-DD as local date', () => {
    const fecha = parseDateLocal('2026-06-03');
    expect(fecha).toBeInstanceOf(Date);
    expect(fecha.getFullYear()).toBe(2026);
    expect(fecha.getMonth()).toBe(5);
    expect(fecha.getDate()).toBe(3);
  });

  test('parseDateLocal returns null for invalid string', () => {
    expect(parseDateLocal('not-a-date')).toBeNull();
  });

  test('formatDateLocal returns localized date string', () => {
    const formatted = formatDateLocal('2026-06-03', 'es-CO');
    expect(formatted).toMatch(/3.*2026/);
  });

  test('formatInputDateLocal formats local dates for HTML inputs', () => {
    expect(formatInputDateLocal('2026-06-03')).toBe('2026-06-03');
  });
});
