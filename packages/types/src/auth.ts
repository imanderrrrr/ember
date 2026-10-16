/**
 * Tipos de Autenticación y Control de Acceso Basado en Roles (RBAC).
 */

export type UserRole =
  | "gerente_operativo"
  | "admin"
  | "cajero"
  | "mesero"
  | "cocina"
  | "chef"
  | "host";

export const USER_ROLES: readonly UserRole[] = [
  "gerente_operativo",
  "admin",
  "cajero",
  "mesero",
  "cocina",
  "chef",
  "host",
] as const;

export const ROLE_LABELS: Record<string, string> = {
  gerente_operativo: "Gerente operativo",
  admin: "Administrador",
  cajero: "Cajero",
  mesero: "Mesero",
  cocina: "Chef de partida",
  chef: "Chef de cocina",
  host: "Anfitrión",
};

export interface AuthUserDTO {
  id: string;
  email: string;
  name: string;
  role: UserRole | string;
  avatarInitials: string;
}

export interface ServerTokenPayload {
  sub: string;
  role: string;
  email?: string;
  name?: string;
  exp?: number;
  [key: string]: unknown;
}

export interface VerifyPinInput {
  userId: string;
  pin: string;
}
