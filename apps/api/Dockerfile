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

FROM base AS prod
ENV NODE_ENV=production
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/apps/api/node_modules /app/apps/api/node_modules
COPY --from=build /app/apps/api/dist /app/apps/api/dist
COPY --from=build /app/apps/api/package.json /app/apps/api/
WORKDIR /app/apps/api
EXPOSE 3000
CMD ["node", "dist/main"]
