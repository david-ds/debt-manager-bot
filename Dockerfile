FROM node:5

RUN npm install nodemon -g

WORKDIR /usr/src/app

EXPOSE 3000

CMD nodemon -L
