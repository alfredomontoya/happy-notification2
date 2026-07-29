import auth from '@react-native-firebase/auth';
import {getDatabase} from './sqlite';
import {getFirestoreDB} from './firebase';
import type {Persona} from './types';
import {
  getCachedPersonas,
  setCachedPersonas,
  invalidatePersonasCache,
} from './personasCache';

const COLLECTION = 'personas';

function getUserId(): string {
  const uid = auth().currentUser?.uid;
  if (!uid) throw new Error('Usuario no autenticado');
  return uid;
}

function generateId(): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 10);
  return `${ts}${rand}`;
}

function computeBirthdayFields(
  fecha: string,
): {birthday_month: number; birthday_day: number} {
  const d = new Date(fecha);
  return {
    birthday_month: d.getMonth() + 1,
    birthday_day: d.getDate(),
  };
}

function rowToPersona(row: any): Persona {
  return {
    id: row.id,
    user_id: row.user_id,
    ci: row.ci,
    nombre: row.nombre,
    cargo: row.cargo,
    dependencia: row.dependencia,
    fecha_nacimiento: row.fecha_nacimiento,
    birthday_month: row.birthday_month,
    birthday_day: row.birthday_day,
    created_at: row.created_at,
  };
}

async function cachePersonasInSqlite(list: Persona[]): Promise<void> {
  const db = await getDatabase();
  await db.executeSql('DELETE FROM personas');
  for (const p of list) {
    await db.executeSql(
      `INSERT INTO personas (id, user_id, ci, nombre, cargo, dependencia, fecha_nacimiento, birthday_month, birthday_day, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        p.id,
        p.user_id,
        p.ci,
        p.nombre,
        p.cargo,
        p.dependencia,
        p.fecha_nacimiento,
        p.birthday_month ?? null,
        p.birthday_day ?? null,
        p.created_at,
      ],
    );
  }
}

async function readFromSqliteAll(): Promise<Persona[]> {
  const db = await getDatabase();
  const [results] = await db.executeSql(
    'SELECT * FROM personas ORDER BY nombre ASC',
  );
  const list: Persona[] = [];
  for (let i = 0; i < results.rows.length; i++) {
    list.push(rowToPersona(results.rows.item(i)));
  }
  return list;
}

async function readFromSqliteById(id: string): Promise<Persona | null> {
  const db = await getDatabase();
  const [results] = await db.executeSql(
    'SELECT * FROM personas WHERE id = ?',
    [id],
  );
  if (results.rows.length === 0) return null;
  return rowToPersona(results.rows.item(0));
}

async function readFromSqliteByMonth(month: number): Promise<Persona[]> {
  const db = await getDatabase();
  const [results] = await db.executeSql(
    'SELECT * FROM personas WHERE birthday_month = ? ORDER BY birthday_day ASC',
    [month],
  );
  const list: Persona[] = [];
  for (let i = 0; i < results.rows.length; i++) {
    list.push(rowToPersona(results.rows.item(i)));
  }
  return list;
}

async function readFromSqliteByDay(month: number, day: number): Promise<Persona[]> {
  const db = await getDatabase();
  const [results] = await db.executeSql(
    'SELECT * FROM personas WHERE birthday_month = ? AND birthday_day = ?',
    [month, day],
  );
  const list: Persona[] = [];
  for (let i = 0; i < results.rows.length; i++) {
    list.push(rowToPersona(results.rows.item(i)));
  }
  return list;
}

async function fetchFromFirestoreAll(): Promise<Persona[]> {
  const snapshot = await getFirestoreDB()
    .collection(COLLECTION)
    .orderBy('nombre', 'asc')
    .get();
  const list: Persona[] = [];
  snapshot.forEach(doc => list.push(doc.data() as Persona));
  return list;
}

export async function getAllPersonas(): Promise<Persona[]> {
  const cached = getCachedPersonas();
  if (cached) return cached;

  const fromSqlite = await readFromSqliteAll();
  if (fromSqlite.length > 0) {
    setCachedPersonas(fromSqlite);
    return fromSqlite;
  }

  try {
    const fresh = await fetchFromFirestoreAll();
    await cachePersonasInSqlite(fresh);
    setCachedPersonas(fresh);
    return fresh;
  } catch {
    return [];
  }
}

export async function refreshPersonas(): Promise<Persona[]> {
  const fresh = await fetchFromFirestoreAll();
  await cachePersonasInSqlite(fresh);
  setCachedPersonas(fresh);
  return fresh;
}

export async function getPersonaById(id: string): Promise<Persona | null> {
  const cached = getCachedPersonas();
  if (cached) {
    const found = cached.find(p => p.id === id);
    if (found) return found;
  }
  const fromSqlite = await readFromSqliteById(id);
  if (fromSqlite) return fromSqlite;
  try {
    const doc = await getFirestoreDB()
      .collection(COLLECTION)
      .doc(id)
      .get();
    if (!doc.exists) return null;
    return doc.data() as Persona;
  } catch {
    return null;
  }
}

export async function createPersona(
  data: Omit<Persona, 'id' | 'user_id' | 'created_at' | 'birthday_month' | 'birthday_day'>,
): Promise<string> {
  const userId = getUserId();
  const id = generateId();
  const now = new Date().toISOString();
  const birthday = computeBirthdayFields(data.fecha_nacimiento);

  const doc: Persona = {
    id,
    user_id: userId,
    ...data,
    ...birthday,
    created_at: now,
  };

  await getFirestoreDB().collection(COLLECTION).doc(id).set(doc);
  invalidatePersonasCache();
  return id;
}

export async function updatePersona(
  id: string,
  data: Partial<
    Omit<Persona, 'id' | 'user_id' | 'created_at' | 'birthday_month' | 'birthday_day'>
  >,
): Promise<void> {
  const updateData: Record<string, any> = {...data};
  if (data.fecha_nacimiento) {
    const birthday = computeBirthdayFields(data.fecha_nacimiento);
    updateData.birthday_month = birthday.birthday_month;
    updateData.birthday_day = birthday.birthday_day;
  }

  await getFirestoreDB().collection(COLLECTION).doc(id).update(updateData);
  invalidatePersonasCache();
}

export async function deletePersona(id: string): Promise<void> {
  await getFirestoreDB().collection(COLLECTION).doc(id).delete();
  invalidatePersonasCache();
}

export async function getPersonasByMonth(
  month: number,
): Promise<Persona[]> {
  return readFromSqliteByMonth(month);
}

export async function getPersonasByDay(
  month: number,
  day: number,
): Promise<Persona[]> {
  return readFromSqliteByDay(month, day);
}

export async function importPersonas(
  data: Omit<Persona, 'id' | 'user_id' | 'created_at' | 'birthday_month' | 'birthday_day'>[],
): Promise<number> {
  const userId = getUserId();
  const now = new Date().toISOString();
  const batch = getFirestoreDB().batch();
  let count = 0;

  for (const p of data) {
    const id = generateId();
    const birthday = computeBirthdayFields(p.fecha_nacimiento);
    const doc: Persona = {
      id,
      user_id: userId,
      ...p,
      ...birthday,
      created_at: now,
    };
    batch.set(getFirestoreDB().collection(COLLECTION).doc(id), doc);
    count++;
  }

  await batch.commit();
  invalidatePersonasCache();
  return count;
}

export async function limpiarPersonas(): Promise<void> {
  const snapshot = await getFirestoreDB()
    .collection(COLLECTION)
    .get();
  const batch = getFirestoreDB().batch();
  snapshot.forEach(doc => batch.delete(doc.ref));
  await batch.commit();
  invalidatePersonasCache();
}

const BATCH_SIZE_PERSONAS = 100;

export async function importPersonasBatch(
  data: Omit<Persona, 'id' | 'user_id' | 'created_at' | 'birthday_month' | 'birthday_day'>[],
  onProgress?: (processed: number) => void,
): Promise<number> {
  const userId = getUserId();
  const now = new Date().toISOString();
  let count = 0;

  for (let i = 0; i < data.length; i += BATCH_SIZE_PERSONAS) {
    const chunk = data.slice(i, i + BATCH_SIZE_PERSONAS);
    const batch = getFirestoreDB().batch();

    for (const p of chunk) {
      const id = generateId();
      const birthday = computeBirthdayFields(p.fecha_nacimiento);
      const doc: Persona = {
        id,
        user_id: userId,
        ...p,
        ...birthday,
        created_at: now,
      };
      batch.set(getFirestoreDB().collection(COLLECTION).doc(id), doc);
    }

    await batch.commit();
    count += chunk.length;
    onProgress?.(count);
  }

  invalidatePersonasCache();
  return count;
}
