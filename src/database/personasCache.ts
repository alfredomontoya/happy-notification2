import type {Persona} from './types';

const CACHE_TTL = 30 * 60 * 1000;

let cache: Persona[] | null = null;
let cacheTimestamp = 0;

export function getCachedPersonas(): Persona[] | null {
  if (!cache) return null;
  if (Date.now() - cacheTimestamp > CACHE_TTL) {
    cache = null;
    return null;
  }
  return cache;
}

export function setCachedPersonas(personas: Persona[]): void {
  cache = personas;
  cacheTimestamp = Date.now();
}

export function invalidatePersonasCache(): void {
  cache = null;
  cacheTimestamp = 0;
}
