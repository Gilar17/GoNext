/**
 * Даты поездок: UI — DD.MM.YYYY, хранение — YYYY-MM-DD.
 */

type DateParts = { y: number; m: number; d: number };

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function isValidYmd(y: number, m: number, d: number): boolean {
  if (m < 1 || m > 12 || d < 1 || d > 31) {
    return false;
  }
  const date = new Date(y, m - 1, d);
  return (
    date.getFullYear() === y &&
    date.getMonth() === m - 1 &&
    date.getDate() === d
  );
}

function formatParts(parts: DateParts): string {
  return `${pad2(parts.d)}.${pad2(parts.m)}.${parts.y}`;
}

function toStorageParts(parts: DateParts): string {
  return `${parts.y}-${pad2(parts.m)}-${pad2(parts.d)}`;
}

/** Разбирает DD.MM.YYYY, YYYY-MM-DD или ISO-дату с временем. */
function parseDateParts(value: string): DateParts | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const dmy = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(trimmed);
  if (dmy) {
    const d = Number(dmy[1]);
    const m = Number(dmy[2]);
    const y = Number(dmy[3]);
    return isValidYmd(y, m, d) ? { y, m, d } : null;
  }

  const ymd = /^(\d{4})-(\d{2})-(\d{2})/.exec(trimmed);
  if (ymd) {
    const y = Number(ymd[1]);
    const m = Number(ymd[2]);
    const d = Number(ymd[3]);
    return isValidYmd(y, m, d) ? { y, m, d } : null;
  }

  return null;
}

/** Отображение даты в UI: DD.MM.YYYY */
export function formatDateLabel(value: string | null | undefined): string {
  if (!value) {
    return 'Не указана';
  }
  const parts = parseDateParts(value);
  if (!parts) {
    return value;
  }
  return formatParts(parts);
}

export function formatDateTimeLabel(value: string | null | undefined): string {
  if (!value) {
    return 'Не указано';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    const parts = parseDateParts(value);
    return parts ? formatParts(parts) : value;
  }
  return date.toLocaleString('ru-RU');
}

/** Storage / ISO → строка для поля формы (DD.MM.YYYY) или ''. */
export function toUiDate(value: string | null | undefined): string {
  if (!value) {
    return '';
  }
  const parts = parseDateParts(value);
  return parts ? formatParts(parts) : '';
}

/**
 * Ввод из формы → YYYY-MM-DD для хранения, или null если пусто.
 * При неверном формате бросает Error.
 */
export function toStorageDate(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const parts = parseDateParts(trimmed);
  if (!parts) {
    throw new Error('Укажите дату в формате ДД.ММ.ГГГГ');
  }
  return toStorageParts(parts);
}

/** @deprecated Используйте toStorageDate */
export function normalizeDateInput(value: string): string | null {
  return toStorageDate(value);
}
