# Build stage
FROM node:20.18.3 AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy application code
COPY . .

# Build the Next.js application
RUN npm run build

# Production stage - using a smaller base image
FROM node:20.18.3-slim

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install only production dependencies
RUN npm install --only=production

# Copy the built application from the builder stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.js ./

# Expose the production server port
EXPOSE 3000

# Start the production server
CMD ["npm", "run", "start"]