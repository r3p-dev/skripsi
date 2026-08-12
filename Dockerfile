FROM node:24-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME/bin:$PATH"
ENV CI=1
RUN corepack enable

WORKDIR /app
COPY pnpm-lock.yaml ./

FROM base AS prod-deps

RUN pnpm fetch --prod
COPY package.json pnpm-workspace.yaml .npmrc ./
RUN pnpm install --offline --frozen-lockfile --prod --ignore-scripts

FROM base AS build

RUN pnpm fetch
COPY package.json pnpm-workspace.yaml .npmrc svelte.config.js ./
RUN pnpm install --offline --frozen-lockfile

COPY . .
RUN pnpm run build

FROM node:24-slim AS prod
WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3333

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=prod-deps /app/package.json ./package.json
COPY --from=build /app/build ./build

RUN mkdir -p /app/storage

USER node

EXPOSE 3333
CMD ["node", "bin/server.js"]