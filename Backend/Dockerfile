FROM node:20-alpine

# Install build tools if any native modules need compilation (e.g. bcrypt)
# Although we use bcryptjs in JS code, package.json still references bcrypt.
RUN apk add --no-cache python3 make g++

WORKDIR /usr/src/app

# Copy package manifests first to leverage Docker layer caching
COPY package*.json ./

# Install dependencies (including production and dev dependencies if needed,
# but for production only npm ci --omit=dev is standard. We will do a full install).
RUN npm install

# Copy source code
COPY . .

# Expose port
EXPOSE 8000

# Start command
CMD ["npm", "start"]
