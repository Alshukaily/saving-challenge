# Node.js 22 LTS Alpine Base Image
FROM node:22-alpine AS builder

# Set working directory
WORKDIR /app

# Install build tools required for native modules
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source files
COPY . .

# Build Vite frontend static assets
RUN npm run build

# Production Image
FROM node:22-alpine AS runner

WORKDIR /app

# Install build dependencies for better-sqlite3 runtime
RUN apk add --no-cache python3 make g++

# Set Environment Variables
ENV NODE_ENV=production
ENV PORT=3000
ENV DB_PATH=/app/data/saving_challenge.sqlite

# Copy package files and install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy backend files and dist build from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.js ./
COPY --from=builder /app/database.js ./
COPY --from=builder /app/authMiddleware.js ./
COPY --from=builder /app/challengeHelper.js ./

# Create data directory for volume mapping
RUN mkdir -p /app/data

# Expose Web Port
EXPOSE 3000

# Start Application Server
CMD ["node", "server.js"]
