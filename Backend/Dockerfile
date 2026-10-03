FROM node:20-alpine

WORKDIR /app

# Copy package descriptors
COPY package*.json ./

# Install only production dependencies with legacy peer deps
RUN npm ci --omit=dev --legacy-peer-deps

# Create uploads folder
RUN mkdir -p uploads

# Copy application code
COPY . .

EXPOSE 5000

CMD ["node", "server.js"]
