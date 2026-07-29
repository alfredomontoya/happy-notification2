import type {PermissionLevel, Permissions} from '../database/types';

const LEVEL_ORDER: Record<PermissionLevel, number> = {
  none: 0,
  read: 1,
  write: 2,
  admin: 3,
};

export type ModuleKey = keyof Permissions;
export type Action = 'create' | 'edit' | 'delete' | 'import';

const ACTION_REQUIRED: Record<Action, PermissionLevel> = {
  create: 'write',
  edit: 'write',
  delete: 'admin',
  import: 'admin',
};

export function can(
  permissions: Permissions | undefined,
  moduleKey: ModuleKey,
  action: Action,
): boolean {
  const level = permissions?.[moduleKey] ?? 'none';
  return LEVEL_ORDER[level] >= LEVEL_ORDER[ACTION_REQUIRED[action]];
}

export function canAccess(
  permissions: Permissions | undefined,
  moduleKey: ModuleKey,
): boolean {
  const level = permissions?.[moduleKey] ?? 'none';
  return LEVEL_ORDER[level] >= LEVEL_ORDER.read;
}

const MODULE_SCREENS: {module: ModuleKey; screen: string}[] = [
  {module: 'cumpleanios', screen: 'Cumpleaños'},
  {module: 'funcionarios', screen: 'Funcionarios'},
  {module: 'gestiones', screen: 'Gestión'},
  {module: 'configuracion', screen: 'Configuración'},
  {module: 'usuarios', screen: 'Usuarios'},
];

export function getFirstAvailableScreen(
  permissions: Permissions | undefined,
): string {
  for (const {module, screen} of MODULE_SCREENS) {
    if (canAccess(permissions, module)) {
      return screen;
    }
  }
  return 'Perfil';
}
