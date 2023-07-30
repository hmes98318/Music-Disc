FROM node:18.17.0

WORKDIR /bot
COPY . .

RUN apt update -y
RUN npm install

CMD [ "npm", "run", "start" ]