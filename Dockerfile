# =========================
# Base
# =========================
FROM node:24-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME/bin:$PATH"
RUN corepack enable

WORKDIR /app

# =========================
# Dependencies
# =========================
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
  pnpm fetch
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
  pnpm install --offline --frozen-lockfile

# =========================
# Build
# =========================
COPY . .
RUN pnpm exec node ace build
RUN pnpm prune --prod

FROM node:24-slim AS prod
WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3333

COPY --from=base /app/build ./
COPY --from=base /app/node_modules ./node_modules

RUN mkdir -p /app/storage

EXPOSE 3333
CMD ["node", "bin/server.js"]