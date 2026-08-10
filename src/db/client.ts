/**
 * Подключение SQLite.
 * Полная инициализация схемы — в Этапе 3.
 */
import * as SQLite from 'expo-sqlite';

export function openAppDatabase(): SQLite.SQLiteDatabase {
  return SQLite.openDatabaseSync('gonext.db');
}

/** Проверка, что модуль expo-sqlite доступен. */
export function isSqliteAvailable(): boolean {
  return typeof SQLite.openDatabaseSync === 'function';
}
