import {getFirestoreDB} from './firebase';
import type {Gestion} from './types';
import type {FirebaseFirestoreTypes} from '@react-native-firebase/firestore';

const COLLECTION = 'gestiones';

const CACHE_TTL = 30 * 60 * 1000;
let cache: Gestion[] | null = null;
let cacheTimestamp = 0;

function getCached(): Gestion[] | null {
  if (!cache) return null;
  if (Date.now() - cacheTimestamp > CACHE_TTL) {
    cache = null;
    return null;
  }
  return cache;
}

function setCached(data: Gestion[]): void {
  cache = data;
  cacheTimestamp = Date.now();
}

export function invalidateGestionesCache(): void {
  cache = null;
  cacheTimestamp = 0;
}

function collectionRef() {
  return getFirestoreDB().collection(COLLECTION);
}

export async function getAllGestiones(): Promise<Gestion[]> {
  const cached = getCached();
  if (cached) return cached;

  const snapshot = await collectionRef()
    .orderBy('year', 'desc')
    .orderBy('created_at', 'desc')
    .get();
  const list: Gestion[] = [];
  snapshot.forEach((doc: FirebaseFirestoreTypes.DocumentSnapshot) =>
    list.push({id: doc.id, ...doc.data()} as Gestion),
  );
  setCached(list);
  return list;
}

export async function getGestionById(
  id: string,
): Promise<Gestion | null> {
  const cached = getCached();
  if (cached) {
    const found = cached.find(g => g.id === id);
    if (found) return found;
  }
  const doc = await collectionRef().doc(id).get();
  if (!doc.exists) return null;
  return {id: doc.id, ...doc.data()} as Gestion;
}

export async function createGestion(
  data: Omit<Gestion, 'id' | 'created_at' | 'updated_at'>,
): Promise<string> {
  const now = new Date().toISOString();
  const docRef = await collectionRef().add({
    ...data,
    created_at: now,
    updated_at: now,
  });
  invalidateGestionesCache();
  return docRef.id;
}

export async function updateGestion(
  id: string,
  data: Partial<Omit<Gestion, 'id' | 'created_at'>>,
): Promise<void> {
  const now = new Date().toISOString();
  await collectionRef().doc(id).update({
    ...data,
    updated_at: now,
  });
  invalidateGestionesCache();
}

export async function deleteGestion(id: string): Promise<void> {
  await collectionRef().doc(id).delete();
  invalidateGestionesCache();
}
