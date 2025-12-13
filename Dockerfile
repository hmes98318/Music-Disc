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

# fly.toml app configuration file generated for music-disc on 2025-12-13T13:07:22Z
#
# See https://fly.io/docs/reference/configuration/ for information about how to use this file.
#

app = 'music-disc'
primary_region = 'sin'

[build]

[http_service]
  internal_port = 3000
  force_https = true
  auto_stop_machines = 'stop'
  auto_start_machines = true
  min_machines_running = 0
  processes = ['app']

[[vm]]
  memory = '1gb'
  cpu_kind = 'shared'
  cpus = 1
  memory_mb = 1024
