import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { fetchFloorPlan } from "../_lib/server-api";
import { Editor } from "./editor";

/**
 * `/salon/edit` — Modo edición del salón.
 *
 * Server Component: valida la sesión, trae el floor plan inicial vía
 * el api Hono, y lo pasa al cliente como prop. El cliente maneja
 * el state y persiste los cambios contra `/api/salon/*` (proxy).
 */
export default async function SalonEditPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const initial = await fetchFloorPlan();

  return <Editor initial={initial} />;
}
