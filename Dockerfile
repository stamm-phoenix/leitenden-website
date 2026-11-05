# The Leitendenbereich as a Node server (SvelteKit adapter-node) for Azure Container Apps.
# Needs the submodule: `git submodule update --init` before building.
FROM oven/bun:1.4.2 AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM deps AS build
ARG BUILD_COMMIT_SHA=""
ENV BUILD_COMMIT_SHA=$BUILD_COMMIT_SHA
COPY . .
RUN bun run build

FROM oven/bun:1.4.2 AS prod-deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

FROM node:24-slim
ENV NODE_ENV=production \
    PORT=3000 \
    # Container Apps terminates TLS; the protocol of the request comes in this header
    PROTOCOL_HEADER=x-forwarded-proto \
    BODY_SIZE_LIMIT=30M
WORKDIR /app
COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/build ./build
COPY --chown=node:node package.json ./
# Files the API of website-astro reads at run time (fonts and images of PDFs, templates)
COPY --chown=node:node vendor/website-astro/api/assets ./vendor/website-astro/api/assets
USER node
EXPOSE 3000
CMD ["node", "build/index.js"]
