# syntax=docker/dockerfile:1.18@sha256:dabfc0969b935b2080555ace70ee69a5261af8a8f1b4df97b9e7fbcf6722eddf

# Keep the human-readable versions for update tooling and pin the multi-platform
# manifests so a registry-side tag change cannot alter a production build.
ARG BUN_VERSION=1.4.0
ARG BUN_IMAGE_DIGEST=sha256:07235578f79ef8c6f97d94aee7938e76f5cdba5f21ae5dbfdd3d3d38058437eb
ARG NODE_IMAGE_DIGEST=sha256:e67514e5d0f6c46656005e1b693b2ec9d52e80b641307de684d4a015ba7a4eaf

FROM oven/bun:${BUN_VERSION}-alpine@${BUN_IMAGE_DIGEST} AS deps
WORKDIR /app

# Husky is a development convenience and must not run in an image build.
ENV HUSKY=0
COPY package.json bun.lock ./
RUN --mount=type=cache,target=/root/.bun/install/cache \
	bun install --frozen-lockfile

FROM oven/bun:${BUN_VERSION}-alpine@${BUN_IMAGE_DIGEST} AS builder
WORKDIR /app

ENV NODE_ENV=production \
	NEXT_TELEMETRY_DISABLED=1 \
	HUSKY=0

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* values are deliberately public and are compiled into the client
# bundle. Server secrets are not used to build: the placeholders below prove
# that the build is independent from production services and only satisfy
# import-time validation. The runner receives the real values at runtime.
ARG NEXT_PUBLIC_APP_URL=http://localhost:3000
ARG NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY=build-only-site-key
ARG NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL} \
	NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY=${NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY} \
	NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=${NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}

RUN DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build \
	R2_ENDPOINT=https://build.invalid \
	R2_ACCESS_KEY_ID=build-only \
	R2_SECRET_ACCESS_KEY=build-only \
	R2_BUCKET_NAME=build-only \
	R2_PUBLIC_URL=https://build.invalid \
	BETTER_AUTH_SECRET=build-only-secret-build-only-secret \
	BETTER_AUTH_URL=http://localhost:3000 \
	GOOGLE_CLIENT_ID=build-only \
	GOOGLE_CLIENT_SECRET=build-only \
	CLOUDFLARE_TURNSTILE_SECRET_KEY=build-only \
	bun run build

FROM node:24-alpine@${NODE_IMAGE_DIGEST} AS runner
WORKDIR /app

ENV NODE_ENV=production \
	NEXT_TELEMETRY_DISABLED=1 \
	HOSTNAME=0.0.0.0 \
	PORT=3000

RUN addgroup --gid 1001 --system nodejs \
	&& adduser --uid 1001 --system --ingroup nodejs --home /app nextjs

# Next.js standalone output contains the traced runtime dependencies. Static
# assets and public files are intentionally copied separately per Next.js docs.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
RUN mkdir -p .next/cache && chown nextjs:nodejs .next/cache

USER nextjs
EXPOSE 3000
STOPSIGNAL SIGTERM
CMD ["node", "server.js"]
