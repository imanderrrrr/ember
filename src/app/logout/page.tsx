"use client";

import { useEffect } from "react";
import { signOut } from "next-auth/react";

export default function LogoutPage() {
  useEffect(() => {
    // signOut con callbackUrl rebota a la landing una vez que la cookie está
    // limpia. redirect:true (default) garantiza que el navegador haga el viaje
    // y la próxima petición salga sin sesión.
    signOut({ callbackUrl: "/", redirect: true });
  }, []);

  return (
    <main className="flex h-screen w-full items-center justify-center bg-[#0e0a08]">
      <div className="flex items-center gap-2.5">
        <span className="size-1.5 animate-pulse rounded-full bg-[#E67E22]" />
        <span className="font-mono text-[10px] font-medium tracking-[0.42em] text-[#a89d8e]">
          CERRANDO SESIÓN
        </span>
      </div>
    </main>
  );
}
