# syntax=docker/dockerfile:1.7
# Bun installs and builds; the standalone server runs under Node.
FROM oven/bun:1.3-alpine AS deps
WORKDIR /app
COPY package.json bun.lock ./
# The `preinstall` script shells out to npx, which does not exist in this image.
RUN bun install --frozen-lockfile --ignore-scripts

FROM oven/bun:1.3-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* are compiled into the client bundle and are public by nature,
# so passing them as build args is fine.
ARG NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY
ARG NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
ENV NEXT_TELEMETRY_DISABLED=1

# Server-only secrets arrive as a mounted file instead of ARG/ENV so they never
# land in an image layer or in `docker history`. Next needs them present at
# build because env.ts and better-auth both validate at module load, and route
# handlers like /api/auth/[...all] are evaluated during page-data collection.
RUN --mount=type=secret,id=build_env \
    set -a && . /run/secrets/build_env && set +a && bun run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Bind on all interfaces so the container is reachable from the host.
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

RUN addgroup -g 1001 -S nodejs && adduser -u 1001 -S nextjs -G nodejs

# `output: "standalone"` deliberately omits these two; the server expects them
# alongside it, and forgetting them ships a site with no CSS or images.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
