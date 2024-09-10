# Use an official Node.js runtime as the base image
FROM node:18

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the container
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your application code to the container
COPY . .

# Expose the port your backend will run on (if server runs on port 5000, adjust if needed)
EXPOSE 5000

# Command to start the server
CMD [ "node", "server.js" ]
