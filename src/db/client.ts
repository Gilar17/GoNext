import * as SQLite from 'expo-sqlite';

const DB_NAME = 'gonext.db';

let database: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!database) {
    database = await SQLite.openDatabaseAsync(DB_NAME);
    await database.execAsync('PRAGMA foreign_keys = ON;');
  }
  return database;
}

export function openAppDatabase(): SQLite.SQLiteDatabase {
  return SQLite.openDatabaseSync(DB_NAME);
}

export function isSqliteAvailable(): boolean {
  return typeof SQLite.openDatabaseSync === 'function';
}
