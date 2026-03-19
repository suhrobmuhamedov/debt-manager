FROM node:20-alpine

WORKDIR /app

# Copy root package files
COPY package*.json ./

# Copy server package files
COPY apps/server/package*.json ./apps/server/

# Copy server source and config
COPY apps/server/src ./apps/server/src
COPY apps/server/tsconfig.json ./apps/server/tsconfig.json

# Install dependencies
RUN npm install --workspace=apps/server

# Build server
WORKDIR /app/apps/server
RUN npm run build

EXPOSE 3001

CMD ["node", "dist/index.js"]
