FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --no-audit --no-fund --prefer-offline
COPY . .
EXPOSE 5173
CMD ["npm", "start"]
