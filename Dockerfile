# syntax=docker/dockerfile:1

FROM node:20-alpine AS base
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN apk add --no-cache libc6-compat \
 && corepack enable pnpm

WORKDIR /app

########################
# deps
########################
FROM base AS deps
WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
# COPY turbo.json ./        # if you have it
# COPY .npmrc ./            # if you have it

RUN pnpm install --frozen-lockfile

########################
# build
########################
FROM base AS build
WORKDIR /app

# Copy full repo
COPY . .
ENV CI=true
# Install using the lockfile (this will recreate node_modules in this stage)
RUN pnpm install --frozen-lockfile

# Root build (can run turbo internally)
RUN pnpm build

########################
# runner
########################
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    CI=true

# Copy only what you need at runtime
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/web/.next ./apps/web/.next
COPY --from=build /app/apps/web/package.json ./apps/web/package.json

EXPOSE 3000

CMD ["pnpm", "start"]
