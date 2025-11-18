# Stage 1: Builder (TypeScript compilation)
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json tsconfig.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY src ./src
COPY data ./data

# Build TypeScript
RUN npm run build

# Stage 2: Runtime (minimal dependencies)
FROM node:20-alpine AS runtime

WORKDIR /app

# Install production dependencies only
COPY package.json ./
RUN npm install --production

# Copy built files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/data ./data

# Copy environment template
COPY .env.example ./

# Expose port
EXPOSE 3003

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3003/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start server
CMD ["node", "dist/index.js"]

