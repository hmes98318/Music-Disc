FROM node:22.14.0-slim AS node_build

WORKDIR /tmp

COPY . .

RUN npm ci && \
    npm run build


############################################################

FROM node:22.14.0-slim

WORKDIR /bot

RUN apt update -y && \
    apt install openjdk-17-jre-headless -y && \
    apt clean && rm -rf /var/lib/apt/lists/*


COPY --from=node_build /tmp/dist /bot
COPY --from=node_build /tmp/node_modules /bot/node_modules
COPY --from=node_build /tmp/server /bot/server
COPY --from=node_build /tmp/views /bot/views

COPY --from=node_build /tmp/package*.json /bot
COPY --from=node_build /tmp/config.js /bot


ENTRYPOINT [ "node", "./src/index.js" ]