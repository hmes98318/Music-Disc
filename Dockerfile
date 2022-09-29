FROM node:16.17.1-slim

WORKDIR /src/bot

COPY ./ /src/bot

RUN npm install

CMD [ "node","index.js" ]
