# syntax=docker/dockerfile:1

########################
# Base image
########################
FROM node:20-alpine AS base

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1

WORKDIR /app

# Install required OS deps and enable pnpm via corepack
RUN apk add --no-cache libc6-compat \
 && corepack enable pnpm

########################
# Install dependencies
########################
FROM base AS deps

WORKDIR /app

# Only copy files needed for dependency resolution
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/web/package.json apps/web/package.json

# Install all workspace dependencies (including web)
RUN pnpm install --frozen-lockfile

########################
# Build app
########################
FROM base AS build

WORKDIR /app

# Copy full repo (source, configs, etc.)
COPY . .

# Reuse installed deps from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules

# Build only the web app
RUN pnpm --filter web build

########################
# Runtime image
########################
FROM base AS runner

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1

# Use repo root as workdir so pnpm workspace resolution works
WORKDIR /app

# Copy production deps and built files
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/web/.next ./apps/web/.next
COPY --from=build /app/apps/web/package.json ./apps/web/package.json
COPY --from=build /app/apps/web/public ./apps/web/public

EXPOSE 3000

# Start the Next.js app from the workspace
CMD ["pnpm", "--filter", "web", "start"]
