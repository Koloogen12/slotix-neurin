FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* vars are inlined into the client bundle at build time, not read at
# container runtime — must be passed as build args here, not just in the compose
# service's `environment:` block.
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Built on a 1 GB host, where Node's default heap is smaller than a full Next build needs.
# Inline rather than ENV so the runner stage is unaffected.
RUN NODE_OPTIONS=--max-old-space-size=1536 npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# `output: "standalone"` traces only the modules the server actually imports, but it does
# not copy public/ or the client chunks — Next expects both to be placed alongside it.
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
