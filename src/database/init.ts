import SQLite from 'react-native-sqlite-storage';
import {generarPersonas} from '../utils/seed';
import {createPersona} from './personas';

SQLite.enablePromise(true);

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) {
    return db;
  }

  db = await SQLite.openDatabase({
    name: 'stmsc.db',
    location: 'default',
  });

  await db.executeSql(`
    CREATE TABLE IF NOT EXISTS personas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ci TEXT DEFAULT '',
      nombre TEXT NOT NULL,
      cargo TEXT DEFAULT '',
      dependencia TEXT DEFAULT '',
      fecha_nacimiento TEXT NOT NULL
    )
  `);

  const [result] = await db.executeSql(
    'SELECT COUNT(*) as count FROM personas',
  );
  const count = result.rows.item(0).count;

  if (count === 0) {
    const personas = generarPersonas(50);
    for (const p of personas) {
      await createPersona(db, p);
    }
  }

  return db;
}
