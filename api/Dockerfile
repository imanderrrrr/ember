# syntax=docker/dockerfile:1.7
#
# EMBER · api container (Hono + Drizzle + Postgres)
# Multi-stage Dockerfile:
#   - dev    → tsx watch con HMR (usado por docker-compose default)
#   - runner → producción con tsc compilado
#
# Build prod: docker build --target runner -f api/Dockerfile -t ember-api:prod .

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
# deps — install node_modules for api and shared workspace packages
###############################################################################
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/types/package.json ./packages/types/
COPY api/package.json ./api/
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm --filter ember-api... install --frozen-lockfile --ignore-scripts

###############################################################################
# dev — usado por docker-compose para HMR
###############################################################################
FROM deps AS dev
ENV NODE_ENV=development
ENV PORT=3001
EXPOSE 3001
WORKDIR /app/api
# Llamamos a tsx directo (no `pnpm dev`) para evitar el pre-check de pnpm 11
# sobre lockfile/deps que falla en non-TTY y no aporta nada en este contexto.
CMD ["node_modules/.bin/tsx", "watch", "src/index.ts"]

###############################################################################
# build — compila TS a JS
###############################################################################
FROM deps AS build
COPY packages/types ./packages/types
COPY api ./api
WORKDIR /app/api
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
COPY --from=deps  --chown=hono:nodejs /app/api/node_modules ./api/node_modules
COPY --from=build --chown=hono:nodejs /app/api/dist          ./api/dist
COPY --from=build --chown=hono:nodejs /app/api/drizzle       ./api/drizzle
COPY --from=build --chown=hono:nodejs /app/api/package.json  ./api/package.json

WORKDIR /app/api
USER hono
EXPOSE 3001

# tsc compila con rootDir "." → el entry queda en dist/src/index.js
CMD ["node", "dist/src/index.js"]
