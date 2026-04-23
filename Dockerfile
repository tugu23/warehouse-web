# Build stage
FROM --platform=linux/amd64 node:22-alpine AS builder

# Set environment variables for build
ENV VITE_API_BASE_URL=/

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install

# Copy source code
COPY . .

# Build the application
ENV NODE_OPTIONS=--max-old-space-size=4096
RUN pnpm run build

# Production stage
FROM --platform=linux/amd64 nginx:alpine AS production

# Default upstream for /api proxy.
# Override at runtime with: -e API_UPSTREAM=http://your-backend:3000
ENV API_UPSTREAM=http://host.docker.internal:3000
ENV POSAPI_UPSTREAM=http://host.docker.internal:7080

# Copy nginx template; official nginx entrypoint will envsubst it
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

