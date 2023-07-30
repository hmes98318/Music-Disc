FROM node:18.17.0

WORKDIR /bot
COPY . .

RUN apt update -y

RUN npm install
RUN npm install play-dl

CMD [ "npm", "run", "start" ]