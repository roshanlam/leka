# Use the desired Node.js version as the base image
ARG NODE_VERSION=20.2.0
FROM node:${NODE_VERSION}-slim as base

LABEL fly_launch_runtime="Node.js"

# Set the working directory for the app
WORKDIR /app

# Set the production environment
ENV NODE_ENV=production

# Install build dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends python2 pkg-config build-essential && \
    rm -rf /var/lib/apt/lists/*

# Copy package.json and package-lock.json to install dependencies
COPY package.json package-lock.json ./

# Install app dependencies
RUN npm ci --only=production

# Copy the application code
COPY . .

# Final stage for the app image
FROM base

# Copy the built application from the previous stage
COPY --from=base /app /app

# Expose the desired port
EXPOSE 3000

# Start the server by default, this can be overwritten at runtime
CMD ["npm", "run", "start"]
