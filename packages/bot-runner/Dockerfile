# Use a lightweight Node.js version
FROM node:20-alpine

# Set the working folder inside the container
WORKDIR /app

# Copy dependency files first (for caching speed)
COPY package*.json ./
RUN npm install

# Copy the harness script
COPY harness.js .

# Create a placeholder file so the bot doesn't crash if we test without mounting
RUN echo "module.exports = () => console.log('No code mounted');" > dummy_code.js

# default command
CMD ["node", "harness.js"]