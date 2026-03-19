FROM node:20-alpine

WORKDIR /app

# Copy root package files
COPY package*.json ./

# Copy server package files
COPY apps/server/package*.json ./apps/server/

# Install dependencies
RUN npm install --workspace=apps/server

# Copy server source code
COPY apps/server/src ./apps/server/src

# Copy server TypeScript config
COPY apps/server/tsconfig.json ./apps/server/tsconfig.json

# Change to server directory for build
WORKDIR /app/apps/server

# Build TypeScript
RUN npm run build

# Verify build output
RUN ls -la dist/

EXPOSE 3001

# Use absolute path to avoid Railway override issues
CMD ["node", "/app/apps/server/dist/index.js"]
