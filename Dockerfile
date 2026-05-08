# Use Node 20 on Alpine for a small, fast image
FROM node:20-alpine

# Install system dependencies including FFmpeg and Python
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
    && ln -sf python3 /usr/bin/python \
    && python3 -m pip install --no-cache-dir --upgrade yt-dlp --break-system-packages

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy the rest of the application
COPY . .

# Build the Next.js application
RUN npm run build

# Remove dev dependencies to reduce image size
RUN npm prune --production

# Expose the port the app runs on
EXPOSE 8000

# Set environment variables
ENV PORT=8000
ENV NODE_ENV=production

# Start the application
CMD ["npm", "start"]