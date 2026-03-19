FROM node:20-alpine

WORKDIR /app

# Copy root package files
COPY package*.json ./

# Copy server package files
COPY apps/server/package*.json ./apps/server/

# Install all dependencies
RUN npm install --workspace=apps/server

# Copy all source code
COPY . .

# Build the server
WORKDIR /app/apps/server
RUN npm run build

EXPOSE 3001

CMD ["node", "dist/index.js"]
