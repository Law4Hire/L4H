# Build stage for Cannlaw admin
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY ../shared-ui/package*.json ./shared-ui/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .
COPY ../shared-ui ./shared-ui

# Build the application
RUN npm run build

# Production stage - just copy artifacts
FROM alpine:latest AS production

RUN apk --no-cache add ca-certificates
WORKDIR /app

# Copy built artifacts
COPY --from=build /app/dist ./dist

# This stage just holds the artifacts for copying to Caddy volume
CMD ["sh", "-c", "echo 'Cannlaw admin build artifacts ready' && sleep infinity"]
