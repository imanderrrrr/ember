# syntax=docker/dockerfile:1.7
#
# EMBER · web container (Next.js 16)
# Multi-stage Dockerfile with named targets:
#   - dev     → hot-reload with source mounted (used by docker-compose default)
#   - runner  → minimal production image with the standalone server bundle
#
# Build dev:   docker build --target dev -t ember-web:dev .
# Build prod:  docker build --target runner -t ember-web:prod .

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
# deps — install node_modules from the lockfile (cacheable layer)
###############################################################################
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# --ignore-scripts: skip native build scripts (sharp, unrs-resolver). pnpm 11 fails
# the install when these aren't explicitly approved; for our containerized dev/build
# they're not required (Next 16's image optimizer has a JS fallback for sharp).
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile --ignore-scripts

###############################################################################
# dev — used by docker-compose for local development with HMR
# Source is bind-mounted at runtime; node_modules stays inside the container
# via an anonymous volume so the host's (possibly missing) one doesn't shadow it.
###############################################################################
FROM deps AS dev
ENV NODE_ENV=development
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
EXPOSE 3000
CMD ["pnpm", "dev"]

###############################################################################
# build — produces .next/standalone for the runner stage
###############################################################################
FROM deps AS build
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

###############################################################################
# runner — minimal production image
###############################################################################
FROM node:${NODE_VERSION}-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Non-root user for the runtime
RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs

COPY --from=build --chown=nextjs:nodejs /app/public               ./public
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone     ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static         ./.next/static

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
