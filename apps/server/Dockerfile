FROM node:20-alpine

WORKDIR /app/apps/server

# Install only server dependencies
COPY package.json ./package.json

RUN npm install

COPY src ./src
COPY tsconfig.json ./tsconfig.json

RUN npm run build

EXPOSE 8080

CMD ["node", "/app/apps/server/dist/index.js"]
