FROM node:20-alpine

WORKDIR /app

# Copy dependency definitions
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy application source
COPY src/ ./src/

ENV NODE_ENV=production
ENV PORT=10000

EXPOSE 10000

CMD ["node", "src/index.js"]
