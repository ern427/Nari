# Railway üzerinde Node.js Discord botu çalıştırmak için Dockerfile
# sql.js pure JavaScript olduğu için build tools gerekli değil
FROM node:20-alpine

# Çalışma dizini
WORKDIR /app

# Package.json ve package-lock.json kopyala
COPY package*.json ./

# Bağımlılıkları kur (production dependencies)
RUN npm ci --omit=dev

# Kaynak kodu kopyala
COPY . .

# Bot'ı başlat
CMD ["npm", "start"]
