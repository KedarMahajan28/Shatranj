# Build stage
FROM node:20-alpine AS build

WORKDIR /usr/src/app

# Copy package manifests first to leverage Docker layer caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build-time environment variables for Vite
ARG VITE_API_URL
ARG VITE_FRONTEND_URL

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_FRONTEND_URL=$VITE_FRONTEND_URL

# Build the production bundle
RUN npm run build

# Production stage
FROM nginx:stable-alpine

# Copy built assets from build stage to Nginx public folder
COPY --from=build /usr/src/app/dist /usr/share/nginx/html

# Copy Nginx server configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 inside container
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
