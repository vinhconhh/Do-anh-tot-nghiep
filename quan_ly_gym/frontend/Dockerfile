FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

# Chạy Vite với flag --host để Docker có thể ánh xạ port ra ngoài
CMD ["npm", "run", "dev", "--", "--host"]