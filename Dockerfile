# syntax=docker/dockerfile:1

# ---------- Build the React frontend ----------
FROM node:24-alpine AS frontend
WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# ---------- Build the API ----------
FROM node:24-alpine AS backend
WORKDIR /app/backend

COPY backend/package.json backend/package-lock.json ./
RUN npm ci

COPY backend/ ./
RUN npm run build && npm prune --omit=dev

# ---------- Runtime image ----------
FROM node:24-alpine
ENV NODE_ENV=production
WORKDIR /app

COPY --from=backend /app/backend/package.json ./
COPY --from=backend /app/backend/node_modules ./node_modules
COPY --from=backend /app/backend/dist ./dist
# SQL migrations, applied automatically on startup.
COPY --from=backend /app/backend/drizzle ./drizzle
COPY --from=frontend /app/frontend/dist ./public

USER node
EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://localhost:5000/healthz || exit 1
CMD ["node", "dist/server.js"]
