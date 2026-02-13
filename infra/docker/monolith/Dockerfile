FROM node:20-bookworm-slim AS frontend-builder

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM node:20-bookworm-slim

WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --omit=dev
COPY backend/ ./
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

ENV NODE_ENV=production
ENV PORT=3001
ENV FRONTEND_DIST_PATH=/app/frontend/dist
ENV DATABASE_PATH=/data/maas.db

VOLUME ["/data"]
EXPOSE 3001

CMD ["node", "server.js"]
