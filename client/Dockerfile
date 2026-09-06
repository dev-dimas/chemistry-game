# syntax=docker/dockerfile:1

# ------------------------------------------------------------------------------
# Stage 1: Build client static assets using Node 24 Alpine and pnpm
# ------------------------------------------------------------------------------
FROM node:24-alpine AS builder
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@11.0.9 --activate

WORKDIR /app

# Install dependencies first for optimal layer caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml* ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

# Copy source code and build config
COPY . .

# Build arguments for Vite environment variables
ARG VITE_API_URL
ARG VITE_APP_NAME
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_APP_NAME=$VITE_APP_NAME

RUN pnpm run build

# ------------------------------------------------------------------------------
# Stage 2: Minimalist production Nginx server (< 15MB)
# ------------------------------------------------------------------------------
FROM nginx:alpine-slim AS runner

# Remove default nginx static assets and config
RUN rm -rf /usr/share/nginx/html/* /etc/nginx/conf.d/default.conf

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled static assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
