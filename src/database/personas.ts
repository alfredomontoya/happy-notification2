import SQLite from 'react-native-sqlite-storage';
import {Persona} from './types';
import {getDatabase} from './init';

export async function getAllPersonas(): Promise<Persona[]> {
  const db = await getDatabase();
  const [result] = await db.executeSql(
    'SELECT * FROM personas ORDER BY nombre ASC',
  );
  const personas: Persona[] = [];
  for (let i = 0; i < result.rows.length; i++) {
    personas.push(result.rows.item(i));
  }
  return personas;
}

export async function getPersonaById(id: number): Promise<Persona | null> {
  const db = await getDatabase();
  const [result] = await db.executeSql(
    'SELECT * FROM personas WHERE id = ?',
    [id],
  );
  if (result.rows.length === 0) {
    return null;
  }
  return result.rows.item(0);
}

export async function createPersona(
  db: SQLite.SQLiteDatabase,
  data: Omit<Persona, 'id'>,
): Promise<number> {
  const [result] = await db.executeSql(
    'INSERT INTO personas (ci, nombre, cargo, dependencia, fecha_nacimiento) VALUES (?, ?, ?, ?, ?)',
    [data.ci, data.nombre, data.cargo, data.dependencia, data.fecha_nacimiento],
  );
  return result.insertId;
}

export async function createPersonaFromApp(
  data: Omit<Persona, 'id'>,
): Promise<number> {
  const db = await getDatabase();
  return createPersona(db, data);
}

export async function updatePersona(
  id: number,
  data: Omit<Persona, 'id'>,
): Promise<void> {
  const db = await getDatabase();
  await db.executeSql(
    'UPDATE personas SET ci = ?, nombre = ?, cargo = ?, dependencia = ?, fecha_nacimiento = ? WHERE id = ?',
    [data.ci, data.nombre, data.cargo, data.dependencia, data.fecha_nacimiento, id],
  );
}

export async function deletePersona(id: number): Promise<void> {
  const db = await getDatabase();
  await db.executeSql('DELETE FROM personas WHERE id = ?', [id]);
}

export async function importPersonas(
  data: Omit<Persona, 'id'>[],
): Promise<number> {
  const db = await getDatabase();
  let count = 0;
  for (const p of data) {
    try {
      await createPersona(db, p);
      count++;
    } catch {
      // saltar registros con error
    }
  }
  return count;
}

export async function limpiarPersonas(): Promise<void> {
  const db = await getDatabase();
  await db.executeSql('DELETE FROM personas');
}
