FROM node:16.13.2-slim

WORKDIR /src/bot

COPY ./ /src/bot

RUN npm install

CMD [ "node","index.js" ]
