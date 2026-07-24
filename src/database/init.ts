import {initializeDatabase, migrateSchemaIfNeeded} from './sqlite';
import {createAdminUserIfNotExists} from './usuarios';

export async function initializeApp(): Promise<void> {
  await initializeDatabase();
  await migrateSchemaIfNeeded();
  await createAdminUserIfNotExists();
}
