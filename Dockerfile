# syntax=docker/dockerfile:1

FROM node:20-slim AS builder
WORKDIR /app

# Recommended for small images and lightningcss compatibility
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Install OS deps needed for node modules (build tools)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates git build-essential python3 \
  && rm -rf /var/lib/apt/lists/*

# Copy everything (simple, not optimized)
COPY . .
ENV CI=true
# Install dependencies
RUN pnpm install --frozen-lockfile

# Optional: ensure lightningcss native binary is built for this environment
RUN pnpm rebuild lightningcss || true

# Build monorepo (runs "turbo build")
RUN pnpm build

########################
# Runtime image
########################
FROM node:20-slim AS runner
WORKDIR /app

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
ENV NODE_ENV=production

# Copy built app + node_modules
COPY --from=builder /app ./

EXPOSE 3000

# Root script: "start": "pnpm --filter web start"
CMD ["pnpm", "start"]
