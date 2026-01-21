# syntax=docker/dockerfile:1
FROM node:20-alpine AS base
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1
WORKDIR /app
RUN apk add --no-cache libc6-compat \
 && corepack enable pnpm

FROM base AS deps
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/web/package.json apps/web/package.json
RUN pnpm install --frozen-lockfile

FROM base AS build
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile \
 && pnpm --filter web build

FROM base AS runner
WORKDIR /app/apps/web
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/apps/web/.next ./.next
COPY --from=build /app/apps/web/package.json ./package.json
EXPOSE 3000
CMD ["pnpm", "start"]
