FROM node:18-alpine

WORKDIR /app

# Copy root workspace files
COPY package.json package-lock.json ./

# Copy workspace package.json files
COPY client/package.json ./client/
COPY server/package.json ./server/

# Install all workspace dependencies
RUN npm install

# Copy project files
COPY . .

EXPOSE 5001

# Run server workspace
CMD ["npm", "run", "dev", "--workspace=server"]