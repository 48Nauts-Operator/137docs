# FROM node:20-alpine as build
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the code
COPY . .

# Retain build at image-build time to prime cache, but run build again at
# container start so that any host-mounted changes are reflected.

RUN npm run build

# Use sh -c so we can chain commands; we rebuild then serve production build
# via Vite preview. Port is configured in package.json start script.
CMD ["sh", "-c", "npm run build && npm run start"]
