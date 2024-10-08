FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --silent

COPY . .

EXPOSE 443

CMD ["npm", "start"]
