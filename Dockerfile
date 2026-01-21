FROM node:18-alpine

WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

# Copy workspace files FIRST (cache-friendly)
COPY pnpm-lock.yaml package.json pnpm-workspace.yaml ./

# Copy only server package.json first
COPY server/package.json server/package.json

# Install only server deps
RUN pnpm install --filter server...

# Copy rest of server code
COPY server ./server

WORKDIR /app/server

EXPOSE 5001

CMD ["pnpm", "--filter","run","start"]
