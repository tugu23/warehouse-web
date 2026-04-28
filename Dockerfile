# Build stage
FROM --platform=linux/amd64 node:22-alpine AS builder

# Build the SPA against same-origin /api paths; nginx selects the real upstream at runtime.
ENV VITE_API_BASE_URL=
ENV CI=true

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies with npm
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN NODE_OPTIONS="--max-old-space-size=4096" npm run build 2>&1 || (echo "Build failed, checking logs..." && exit 1)

# Production stage
FROM --platform=linux/amd64 nginx:alpine AS production

# Default upstream for /api proxy.
# Override at runtime with: -e API_UPSTREAM=http://your-backend:3000
ENV API_UPSTREAM=http://backend:3000
ENV POSAPI_UPSTREAM=http://host.docker.internal:7080

# Copy nginx template; official nginx entrypoint will envsubst it
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
