FROM node:16.15.0-slim

WORKDIR /src/bot

COPY ./ /src/bot

RUN npm install

CMD [ "node","index.js" ]
