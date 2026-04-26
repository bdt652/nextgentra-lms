# Stage 1: Builder
FROM node:20-alpine AS builder

WORKDIR /app

# Copy monorepo root files (for workspace dependencies)
COPY package.json package-lock.json* ./
COPY packages ./packages

# Copy app source
COPY apps/student-portal/ ./

RUN npm install
RUN npm run build

# Stage 2: Runner
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
USER nextjs

EXPOSE 3000

CMD ["npm", "start"]
