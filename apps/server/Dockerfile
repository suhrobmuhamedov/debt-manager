FROM node:20-alpine

WORKDIR /app

# Install only server dependencies
COPY package.json ./package.json

RUN npm install

COPY src ./src
COPY tsconfig.json ./tsconfig.json

RUN npm run build

EXPOSE 3001

CMD ["node", "dist/index.js"]
