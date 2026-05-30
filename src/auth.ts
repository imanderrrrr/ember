import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

/**
 * Auth.js v5 — Credentials provider que delega la validación al servicio `api`.
 *
 * El web container NO toca la DB directamente: `authorize()` hace fetch a
 * `http://api:3001/auth/verify` y deja que el api consulte Postgres y verifique
 * el hash argon2. Esto mantiene la división planeada:
 *   - web (Auth.js) → cookies, sesión, middleware
 *   - api (Hono)    → DB, validación de secretos, lógica de negocio
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Correo", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // En docker, API_URL=http://api:3001 (DNS interno).
        // En dev host (pnpm dev), cae al puerto expuesto del container api.
        const apiUrl = process.env.API_URL ?? "http://localhost:3001";
        const res = await fetch(`${apiUrl}/auth/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: credentials.email,
            password: credentials.password,
          }),
        }).catch((err) => {
          console.error("[auth] api fetch failed:", err);
          return null;
        });

        if (!res || !res.ok) return null;

        const user = await res.json();
        // Auth.js requiere `id` como string; el resto se merge al token JWT.
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatarInitials: user.avatarInitials,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
        token.avatarInitials = (user as { avatarInitials?: string }).avatarInitials;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.avatarInitials = token.avatarInitials as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
});
