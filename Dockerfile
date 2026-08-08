# Stage 1: Build React Frontend
FROM node:20 AS client-builder
WORKDIR /app

# Copy root package.json (frontend dependencies)
COPY package*.json ./
RUN npm install

# Copy source code and build
COPY . .
RUN npm run build

# Stage 2: Setup Node.js Backend
FROM node:20-slim
WORKDIR /app/server

# Install system dependencies for Prisma (OpenSSL) if needed, though node images usually have them
RUN apt-get update -y && apt-get install -y openssl

# Copy backend dependencies
COPY server/package*.json ./
RUN npm install --production

# Copy backend source code including prisma
COPY server/ .

# Generate Prisma Client
RUN npx prisma generate

# Copy built frontend assets from Stage 1 to /app/dist
COPY --from=client-builder /app/dist ../dist

# Set permissions if needed (optional)
# RUN chown -R node:node /app

# Expose port
EXPOSE 5000

# Start server (Run migrations first for SQLite)
CMD ["sh", "-c", "npx prisma migrate deploy && node src/app.js"]
