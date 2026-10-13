# syntax=docker/dockerfile:1

# ---------- Build the React frontend ----------
FROM node:24-alpine AS frontend
WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ ./

# Firebase web config is inlined into the bundle at build time.
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_STORAGE_BUCKET
ARG VITE_FIREBASE_MESSAGING_SENDER_ID
ARG VITE_FIREBASE_APP_ID
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
COPY --from=frontend /app/frontend/dist ./public

USER node
EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://localhost:5000/healthz || exit 1
CMD ["node", "dist/server.js"]
