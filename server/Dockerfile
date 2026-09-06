# syntax=docker/dockerfile:1

# ------------------------------------------------------------------------------
# Stage 1: Base image with pnpm setup
# ------------------------------------------------------------------------------
FROM node:24-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@11.0.9 --activate

# ------------------------------------------------------------------------------
# Stage 2: Install all dependencies (production + development)
# ------------------------------------------------------------------------------
FROM base AS dependencies
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml* ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

# ------------------------------------------------------------------------------
# Stage 3: Build application and prune dev dependencies
# ------------------------------------------------------------------------------
FROM base AS builder
WORKDIR /app

COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

RUN pnpm run build
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm prune --prod

# ------------------------------------------------------------------------------
# Stage 4: Minimal production runtime
# ------------------------------------------------------------------------------
FROM node:24-alpine AS runner
WORKDIR /app

# dumb-init for proper signal forwarding and PID 1 zombie process reaping
RUN apk add --no-cache dumb-init

ENV NODE_ENV=production
ENV PORT=3000

# Run container as non-root user for security
USER node

COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/dist ./dist

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT:-3000}/health/simple || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
