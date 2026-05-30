"use client";

import { SessionProvider } from "next-auth/react";

/**
 * SessionProvider endurecido para evitar el `ClientFetchError` transitorio
 * ("The string did not match the expected pattern") de Auth.js v5 beta:
 *
 *  - `basePath="/api/auth"`: fija la ruta del cliente en vez de derivarla de
 *    `process.env.NEXTAUTH_URL` (que en el bundle del cliente puede quedar
 *    indefinida y producir una URL inválida en `fetch`).
 *  - `refetchOnWindowFocus={false}`: en dev el code está montado por volumen,
 *    así que cada edición dispara un Fast Refresh; un refetch de sesión al
 *    re-enfocar la ventana puede coincidir con ese rebuild y fallar. La sesión
 *    es un JWT, no hace falta revalidarla en cada foco.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider basePath="/api/auth" refetchOnWindowFocus={false}>
      {children}
    </SessionProvider>
  );
}
