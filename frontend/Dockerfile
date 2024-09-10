# Step 1: Use Node.js to build the frontend
FROM node:18 AS build

# Step 2: Set the working directory inside the container
WORKDIR /usr/src/app

# Step 3: Copy package.json and package-lock.json to install dependencies
COPY package*.json ./

# Step 4: Install dependencies
RUN npm install

# Step 5: Copy the rest of the application code to the container
COPY . .

# Step 6: Build the application
RUN npm run build

# Step 7: Use an NGINX image to serve the built frontend
FROM nginx:alpine

# Step 8: Copy the built frontend from the build step to the NGINX directory
COPY --from=build /usr/src/app/build /usr/share/nginx/html

# Step 9: Expose port 80 for serving the frontend
EXPOSE 80

# Step 10: Start NGINX
CMD ["nginx", "-g", "daemon off;"]
