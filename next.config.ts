import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  // Required for the `runner` stage of Dockerfile: produces a minimal
  // standalone server bundle at .next/standalone with just the needed deps.
  output: "standalone",
  // Permite acceder al dev server (`next dev`) desde otros dispositivos de la
  // LAN, no solo localhost. Sin esto, Next 16 marca como cross-origin las
  // peticiones de HMR/_next al abrir la app por la IP o el nombre del equipo.
  // `*.local` cubre el nombre mDNS estable (p. ej. MacBook-Pro-de-Anderson.local);
  // agrega aquí la IP de tu equipo si accedes por IP y cambia con el tiempo.
  // (En producción —`docker compose -f docker-compose.prod.yml`— no aplica.)
  allowedDevOrigins: ["*.local", "192.168.1.17"],
};

export default nextConfig;
