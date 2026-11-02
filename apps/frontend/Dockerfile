# Multi-stage Docker build for flowCTRL Next.js Frontend
FROM node:20-alpine AS base

FROM base AS builder
WORKDIR /app
COPY package.json package-lock.json* turbo.json* ./
COPY apps/backend/package.json* ./apps/backend/
COPY apps/frontend/package.json ./apps/frontend/
COPY packages/types/package.json* ./packages/types/
COPY packages/roadmap-data/package.json* ./packages/roadmap-data/
RUN npm ci
COPY . .
RUN npx prisma generate --schema="flowCTRL data files/prisma/schema.prisma"
RUN npm run build --workspace=frontend

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/flowCTRL\ data\ files ./flowCTRL\ data\ files
COPY --from=builder /app/apps/frontend/public ./apps/frontend/public
COPY --from=builder /app/apps/frontend/.next ./apps/frontend/.next
COPY --from=builder /app/apps/frontend/package.json ./apps/frontend/package.json

RUN chown -R node:node /app
USER node

EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/api/health || exit 0

CMD ["npm", "start", "--workspace=frontend"]
