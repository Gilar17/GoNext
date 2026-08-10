import { getDatabase } from './client';
import { SCHEMA_SQL } from './schema';
import { ensurePhotosDirectory } from '@/src/services/photos';

type ColumnInfo = {
  name: string;
};

/** Миграция со старой схемы (latitude/longitude) на одно поле dd. */
async function migratePlacesCoordinates(): Promise<void> {
  const db = await getDatabase();
  const columns = await db.getAllAsync<ColumnInfo>('PRAGMA table_info(places)');
  const names = new Set(columns.map((column) => column.name));

  if (!names.has('latitude') && !names.has('longitude')) {
    return;
  }

  await db.execAsync(`
    BEGIN;
    CREATE TABLE IF NOT EXISTS places_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      visitlater INTEGER NOT NULL DEFAULT 0,
      liked INTEGER NOT NULL DEFAULT 0,
      dd TEXT,
      created_at TEXT NOT NULL
    );

    INSERT INTO places_new (id, name, description, visitlater, liked, dd, created_at)
    SELECT
      id,
      name,
      description,
      visitlater,
      liked,
      CASE
        WHEN latitude IS NOT NULL AND longitude IS NOT NULL
          THEN printf('%s, %s', latitude, longitude)
        ELSE NULL
      END,
      created_at
    FROM places;

    DROP TABLE places;
    ALTER TABLE places_new RENAME TO places;
    COMMIT;
  `);
}

export async function initDatabase(): Promise<void> {
  const db = await getDatabase();
  await db.execAsync(SCHEMA_SQL);
  await migratePlacesCoordinates();
  await ensurePhotosDirectory();
}
