# Multi-stage Docker build for flowCTRL Express Backend
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root and workspace manifests
COPY package.json package-lock.json* turbo.json* ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/frontend/package.json* ./apps/frontend/
COPY packages/types/package.json* ./packages/types/
COPY packages/roadmap-data/package.json* ./packages/roadmap-data/

# Install workspace dependencies
RUN npm ci

# Copy source code and centralized schema
COPY . .

# Generate Prisma client from centralized schema
RUN npx prisma generate --schema="flowCTRL data files/prisma/schema.prisma"
RUN npm run build --workspace=backend

# Production Runner Stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Copy node_modules and built packages
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/backend ./apps/backend
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/flowCTRL\ data\ files ./flowCTRL\ data\ files

# Run as non-root unprivileged node user
RUN chown -R node:node /app
USER node

EXPOSE 5000

HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:5000/api/health || exit 1

CMD ["npm", "start", "--workspace=backend"]
