FROM node:20-alpine

WORKDIR /app

# Copy root package files
COPY package*.json ./

# Copy server package files
COPY apps/server/package*.json ./apps/server/

# Copy server source code
COPY apps/server/src ./apps/server/src

# Copy server TypeScript config
COPY apps/server/tsconfig.json ./apps/server/tsconfig.json

# Install dependencies
RUN npm install --workspace=apps/server

# Change to server directory for build
WORKDIR /app/apps/server

# Build TypeScript
RUN npm run build

EXPOSE 3001

# CMD uses relative path from WORKDIR
CMD ["node", "dist/index.js"]
