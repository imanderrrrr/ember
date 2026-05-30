/**
 * Rutas de inicio (ventana principal) por rol. El mesero aterriza en su
 * pantalla de salón; los demás roles van al dashboard.
 *
 * Se usa tanto en el redirect post-login como en el auto-redirect de la
 * landing cuando ya hay sesión activa.
 */
export function homeForRole(role: string | null | undefined): string {
  switch (role) {
    case "mesero":
      return "/mesero";
    case "cocina":
    case "chef":
      return "/cocina";
    default:
      return "/dashboard";
  }
}

/** Etiqueta legible del rol crudo de la DB. */
const ROLE_LABELS: Record<string, string> = {
  gerente_operativo: "Gerente operativo",
  chef: "Chef de cocina",
  cocina: "Chef de partida",
  mesero: "Mesero",
  cajero: "Cajero",
  host: "Anfitrión",
  admin: "Administrador",
};

export function roleLabel(role: string | null | undefined): string {
  return (role && ROLE_LABELS[role]) || "En turno";
}
