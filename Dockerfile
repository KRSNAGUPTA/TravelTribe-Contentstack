FROM node:18-alpine

WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

# Copy workspace files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# Copy server workspace (FULL folder, not just package.json)
COPY server ./server

# Install only server deps
RUN pnpm install --filter server...

WORKDIR /app/server

EXPOSE 5001

CMD ["pnpm", "start"]
