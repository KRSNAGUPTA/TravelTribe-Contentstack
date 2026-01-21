FROM node:18-alpine

WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

# Copy workspace configuration files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# Copy server's package.json first so pnpm can detect the workspace
COPY server/package.json ./server/

# Install dependencies for server workspace
RUN pnpm install --filter server...

# Now copy the rest of the server code
COPY server ./server

WORKDIR /app/server

EXPOSE 5001

CMD ["pnpm", "start"]