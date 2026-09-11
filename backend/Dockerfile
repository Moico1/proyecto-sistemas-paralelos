FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --no-audit --no-fund --prefer-offline
COPY . .
RUN npx prisma generate
EXPOSE 3000
CMD ["npm", "start"]
