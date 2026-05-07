# Use the official Node.js 18 runtime as the base image
FROM node:18-alpine

# Install system dependencies needed for ffmpeg, python, and build tools
# Simplified for better compatibility
RUN apk add --no-cache \
    ffmpeg \
    python3 \
    py3-pip \
    make \
    g++ \
    gcc \
    libc-dev \
    linux-headers \
    zlib-dev \
    libffi-dev \
    openssl-dev \
    && ln -sf python3 /usr/bin/python

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy the rest of the application code
COPY . .

# Build the Next.js application
RUN npm run build

# Remove dev dependencies to reduce image size
RUN npm prune --production

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD ["npm", "start"]