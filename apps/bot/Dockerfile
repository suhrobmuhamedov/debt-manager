FROM node:20-alpine
WORKDIR /app

# Faqat bot uchun sodda install
COPY package.json ./package.json

RUN npm install

COPY src ./src
COPY tsconfig.json ./tsconfig.json

RUN npm run build

CMD ["node", "dist/index.js"]
