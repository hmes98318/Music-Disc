FROM rockylinux:9.1.20230215

WORKDIR /src/bot

RUN dnf update -y

RUN cd ~ && curl -sL https://rpm.nodesource.com/setup_18.x -o nodesource_setup.sh && bash nodesource_setup.sh

RUN dnf install nodejs -y

COPY ./ /src/bot

RUN npm install

CMD [ "npm", "run", "start" ]