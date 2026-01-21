FROM node:18-alpine

WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

# Copy workspace configuration files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# Copy server's package.json first
COPY server/package.json ./server/

# Install dependencies (this creates node_modules at /app)
RUN pnpm install --filter server... --frozen-lockfile

# Copy the rest of the server code
COPY server ./server

# Stay at /app, don't change to /app/server
WORKDIR /app

EXPOSE 5001

# Run from the workspace root
CMD ["pnpm", "--filter", "server", "start"]