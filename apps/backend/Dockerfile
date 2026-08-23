FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/frontend/package.json* ./apps/frontend/
COPY packages/types/package.json* ./packages/types/
COPY packages/roadmap-data/package.json* ./packages/roadmap-data/
COPY turbo.json* ./

RUN npm ci

COPY . .

RUN npx prisma generate --schema=apps/backend/prisma/schema.prisma
RUN npm run build --workspace=backend

EXPOSE 5000
CMD ["npm", "start", "--workspace=backend"]
