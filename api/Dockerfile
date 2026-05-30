# syntax=docker/dockerfile:1.7
#
# EMBER · api container (Hono + Drizzle + Postgres)
# Multi-stage Dockerfile:
#   - dev    → tsx watch con HMR (usado por docker-compose default)
#   - runner → producción con tsc compilado

ARG NODE_VERSION=22

###############################################################################
# base — node + pnpm via corepack
###############################################################################
FROM node:${NODE_VERSION}-alpine AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable
WORKDIR /app

###############################################################################
# deps — install node_modules
###############################################################################
FROM base AS deps
COPY package.json ./
# El api no tiene lockfile compartido con el web (intencional, evita acoplamiento).
# Si en algún momento queremos pnpm workspaces, ajustar aquí.
RUN --mount=type=cache,id=pnpm-store-api,target=/pnpm/store \
    pnpm install --ignore-scripts

###############################################################################
# dev — usado por docker-compose para HMR
###############################################################################
FROM deps AS dev
ENV NODE_ENV=development
ENV PORT=3001
EXPOSE 3001
# Llamamos a tsx directo (no `pnpm dev`) para evitar el pre-check de pnpm 11
# sobre lockfile/deps que falla en non-TTY y no aporta nada en este contexto.
CMD ["node_modules/.bin/tsx", "watch", "src/index.ts"]

###############################################################################
# build — compila TS a JS
###############################################################################
FROM deps AS build
COPY . .
RUN pnpm build

###############################################################################
# runner — imagen mínima de producción
###############################################################################
FROM node:${NODE_VERSION}-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 hono

COPY --from=deps  --chown=hono:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=hono:nodejs /app/dist          ./dist
COPY --from=build --chown=hono:nodejs /app/drizzle       ./drizzle
COPY --from=build --chown=hono:nodejs /app/package.json  ./

USER hono
EXPOSE 3001

# tsc compila con rootDir "." → el entry queda en dist/src/index.js
CMD ["node", "dist/src/index.js"]
