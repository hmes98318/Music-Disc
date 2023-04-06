# FROM rockylinux:9.1.20230215
FROM node:18.15

WORKDIR /bot

# RUN dnf update -y
RUN apt update -y

# RUN cd ~ && curl -sL https://rpm.nodesource.com/setup_18.x -o nodesource_setup.sh && bash nodesource_setup.sh
# RUN dnf install nodejs -y

COPY . .

RUN npm install
RUN npm install play-dl

CMD [ "npm", "run", "start" ]