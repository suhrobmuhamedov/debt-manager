FROM node:20-alpine
WORKDIR /app

# Faqat bot uchun sodda install
COPY apps/bot/package.json ./package.json

RUN npm install

COPY apps/bot/src ./src
COPY apps/bot/tsconfig.json ./tsconfig.json

RUN npm run build

CMD ["node", "dist/index.js"]
