# Multi-Stage Production Dockerfile for FinPilot API
FROM node:22-alpine AS builder

WORKDIR /app
COPY package*.json tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api

RUN npm install
RUN npm run build --workspace=@finpilot/shared
RUN npm run build --workspace=@finpilot/api

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000

COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY apps/api/package*.json ./apps/api/

RUN npm install --omit=dev

COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/apps/api/dist ./apps/api/dist

USER node
EXPOSE 4000

CMD ["node", "apps/api/dist/server.js"]
