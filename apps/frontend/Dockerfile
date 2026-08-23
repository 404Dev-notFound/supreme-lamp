FROM node:20-alpine AS base

FROM base AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
COPY apps/backend/package.json* ./apps/backend/
COPY apps/frontend/package.json ./apps/frontend/
COPY packages/types/package.json* ./packages/types/
COPY packages/roadmap-data/package.json* ./packages/roadmap-data/
COPY turbo.json* ./
RUN npm ci
COPY . .
RUN npx prisma generate --schema=apps/backend/prisma/schema.prisma
RUN npm run build --workspace=frontend

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/apps/frontend/public ./apps/frontend/public
COPY --from=builder /app/apps/frontend/.next ./apps/frontend/.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/apps/frontend/package.json ./apps/frontend/package.json

EXPOSE 3000
ENV PORT=3000
CMD ["npm", "start", "--workspace=frontend"]
