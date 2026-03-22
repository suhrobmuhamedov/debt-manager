FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
COPY apps/bot/package*.json ./apps/bot/

RUN npm install --workspace=apps/bot

COPY apps/bot/ ./apps/bot/

WORKDIR /app/apps/bot

RUN npm run build

CMD ["node", "/app/apps/bot/dist/index.js"]
