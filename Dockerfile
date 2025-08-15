# Stage 1: Build the React application
FROM node:18-alpine AS build

WORKDIR /app

# Install dependencies and then copy the source code
# This is a performance optimization, as it allows Docker to cache this layer
COPY package.json package-lock.json ./
RUN npm install

# Copy the rest of the application source code
COPY . .

# Build the application for production
RUN npm run build

# Stage 2: Serve the application with a lightweight web server
FROM nginx:alpine AS production

# Copy the built files from the 'build' stage to the Nginx public directory
COPY --from=build /app/dist /usr/share/nginx/html

# Copy the custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 to the host machine
EXPOSE 80

# The command to run the Nginx server
CMD ["nginx", "-g", "daemon off;"]
