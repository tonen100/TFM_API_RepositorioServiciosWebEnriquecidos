FROM node:13
WORKDIR /app
COPY package.json .
COPY package-lock.json .
RUN npm i
COPY firebase-config.json .
COPY index.js .
COPY setupDevMongo.js .
COPY /api ./api
EXPOSE 8080
CMD npm start