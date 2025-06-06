FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
COPY prisma ./prisma/
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set build-time environment variables
ENV DATABASE_URL="postgresql://postgres:postgres@db:5432/swe30003"
ENV NEXTAUTH_URL="http://localhost:3000"
ENV NEXTAUTH_SECRET="FH575ZjakYbed9wl+kE1xn9wXWy4FmaLtup6H2zDzSk="
ENV NODE_ENV="production"

# Generate Prisma Client
RUN npx prisma generate

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
ENV DATABASE_URL="postgresql://postgres:postgres@db:5432/swe30003"
ENV NEXTAUTH_URL="http://localhost:3000"
ENV NEXTAUTH_SECRET="FH575ZjakYbed9wl+kE1xn9wXWy4FmaLtup6H2zDzSk="
ENV GOOGLE_CLIENT_ID="21664746739-c7t5f2kasvqq30d2k7e0dppg896fggo6.apps.googleusercontent.com"
ENV GOOGLE_CLIENT_SECRET="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"

# Install netcat for database connection checking
RUN apk add --no-cache netcat-openbsd

# Copy the Next.js build output and dependencies
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY start.sh ./
RUN chmod +x start.sh

# Generate Prisma Client before switching users
RUN npx prisma generate

# Create a non-root user and set permissions
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["./start.sh"] 
