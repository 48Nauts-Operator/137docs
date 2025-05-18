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

# Build the app
# RUN npm run build

# Start the app in development mode
CMD ["npm", "start"]
