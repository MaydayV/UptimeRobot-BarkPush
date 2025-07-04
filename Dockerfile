FROM node:18-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy app files
COPY . .

# Run the app
CMD ["node", "index.js"] 