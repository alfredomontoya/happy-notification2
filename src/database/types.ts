export interface Persona {
  id: string;
  user_id: string;
  ci: string;
  nombre: string;
  cargo: string;
  dependencia: string;
  fecha_nacimiento: string;
  birthday_month?: number;
  birthday_day?: number;
  created_at: string;
}

export type PermissionLevel = 'none' | 'read' | 'write' | 'admin';

export interface Permissions {
  cumpleanios: PermissionLevel;
  funcionarios: PermissionLevel;
  gestiones: PermissionLevel;
  configuracion: PermissionLevel;
}

export interface UserProfile {
  uid: string;
  username: string;
  nombre: string;
  email: string;
  cargo: string;
  role: 'admin' | 'user';
  permissions: Permissions;
  created_at: string;
  created_by: string;
}

export interface Gestion {
  id: string;
  user_id: string;
  year: number;
  titulo: string;
  descripcion: string;
  estado: string;
  created_at: string;
  updated_at: string;
}

export interface Funcionario {
  id: string;
  user_id: string;
  gestion_id: string;
  nro: string;
  ci: string;
  nombres: string;
  apellidos: string;
  cargo: string;
  edificio: string;
  tipo: string;
  responsable: string;
  telresponsable: string;
  estado: string;
  entregado: number;
  search_tokens?: string[];
  created_at: string;
  updated_at: string;
}
