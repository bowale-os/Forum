# Stage 1: Build the React application
# Use a Node.js image with a specific version for consistency
FROM node:18-alpine AS build

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to install dependencies
# This is a performance optimization, as it allows Docker to cache this layer
COPY package*.json ./

# Install project dependencies
RUN npm install

# Copy the rest of the application source code
COPY . .

# Build the application for production
# This creates the optimized static files in the 'dist' directory
RUN npm run build

# Stage 2: Serve the application with a lightweight web server
# Use a very small image for the final container, like Nginx
FROM nginx:alpine AS production

# Copy the built files from the 'build' stage to the Nginx public directory
COPY --from=build /app/dist /usr/share/nginx/html

# Copy the custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 to the host machine
EXPOSE 80

# The command to run the Nginx server
CMD ["nginx", "-g", "daemon off;"]
