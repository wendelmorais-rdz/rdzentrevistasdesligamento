# syntax=docker/dockerfile:1

# ---- Build ----
FROM node:22-bookworm-slim AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---- Runtime ----
# The Nitro build output is fully self-contained (dependencies are bundled
# in), so the runtime image only needs Node itself — no npm install here.
FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/.output ./

EXPOSE 3000
CMD ["node", "server/index.mjs"]
