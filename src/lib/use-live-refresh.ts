"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Mantiene la pantalla "viva": cada `intervalMs` vuelve a pedir los datos del
 * Server Component (router.refresh) sin recargar la página ni perder el estado
 * local del cliente (selección, scroll, etc.). Así los 3 roles ven los cambios
 * de otros casi en tiempo real:
 *   - mesero crea pedido  → aparece en cocina y cambia el estado de la mesa
 *   - cocina avanza estado → se refleja en salón en vivo
 *   - salón en vivo / dashboard → ven los estados de mesa al instante
 *
 * Refresca siempre (incluido KDS de cocina, que es una pantalla siempre
 * encendida) para garantizar que los cambios se vean en todo momento.
 */
export function useLiveRefresh(intervalMs = 4000) {
  const router = useRouter();
  useEffect(() => {
    const id = window.setInterval(() => {
      router.refresh();
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [router, intervalMs]);
}
