# Pins the API's node independently of whatever the host runs.
FROM node:24-alpine AS base
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json apps/api/
RUN pnpm install --filter api --frozen-lockfile

FROM deps AS dev
COPY apps/api apps/api
WORKDIR /app/apps/api
EXPOSE 3000
CMD ["pnpm", "start:dev"]

FROM deps AS build
COPY apps/api apps/api
WORKDIR /app/apps/api
RUN pnpm build

# Last on purpose. The blueprint spec has no field for choosing a stage,
# so the deployed image is whichever one docker builds by default, and
# that is the last. A stage added below this becomes what gets deployed.
FROM base AS prod
ENV NODE_ENV=production
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/apps/api/node_modules /app/apps/api/node_modules
COPY --from=build /app/apps/api/dist /app/apps/api/dist
COPY --from=build /app/apps/api/package.json /app/apps/api/
WORKDIR /app/apps/api
EXPOSE 3000

# The image migrates before it serves, so it behaves the same run from a
# laptop, from compose or from a host, and nothing has to restate the
# startup elsewhere. Render's own pre-deploy step is paid-only, so on the
# free plan this is also the only moment migrations can run at all.
#
# Safe to repeat: typeorm reads the migrations table first, so a restart
# costs one query. It does assume a single instance, which the free plan
# guarantees; more than one would want a lock around it.
#
# exec so that node replaces the shell and receives SIGTERM directly,
# rather than the shell swallowing it and the platform having to kill the
# container.
CMD ["sh", "-c", "node --run migration:run:prod && exec node dist/main"]
