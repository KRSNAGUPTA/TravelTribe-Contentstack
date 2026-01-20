FROM node:18-alpine

WORKDIR /app

# Enable pnpm via corepack (BEST PRACTICE)
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy dependency files first (for caching)
COPY package.json pnpm-lock.yaml ./

RUN pnpm install

# Copy source code
COPY . .

EXPOSE 5001

CMD ["pnpm", "run", "dev"]
