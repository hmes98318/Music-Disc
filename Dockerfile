FROM node:22.22.3-slim AS node_build

WORKDIR /tmp

COPY . .

RUN npm ci && \
    npm --prefix ./dashboard ci && \
    npm run build


############################################################

FROM node:22.22.3-slim

WORKDIR /bot

RUN apt-get update && \
    apt-get install --no-install-recommends -y openjdk-17-jre-headless && \
    rm -rf /var/lib/apt/lists/*


COPY --from=node_build /tmp/dist ./dist
COPY --from=node_build /tmp/node_modules ./node_modules
COPY --from=node_build /tmp/server ./server
COPY --from=node_build /tmp/dashboard/.output/public ./dashboard/.output/public

COPY --from=node_build /tmp/package*.json ./
COPY --from=node_build /tmp/config.js ./


ENTRYPOINT ["npm", "run", "start:server"]
