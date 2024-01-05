FROM node:18.18.2-slim

WORKDIR /bot
COPY . .

RUN apt update -y
RUN apt install openjdk-17-jdk -y

RUN npm install

CMD [ "npm", "run", "start" ]