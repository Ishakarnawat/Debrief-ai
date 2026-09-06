# ==============================================================================
# Debrief.ai — Backend Service Dockerfile
# ==============================================================================
FROM node:18-alpine AS base

WORKDIR /app

# Install curl for container healthchecks
RUN apk add --no-cache curl

# Install production dependencies
COPY package*.json ./
RUN npm ci --only=production || npm install --production

# Copy application source
COPY . .

# Ensure upload directory exists and has write permissions
RUN mkdir -p uploads && chown -R node:node /app

USER node

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

CMD ["node", "server.js"]
