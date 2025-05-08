# Usa una imagen oficial de Node.js como base
FROM node:22-slim

# Instala dependencias necesarias para Chromium
RUN apt-get update && \
    apt-get install -y wget ca-certificates fonts-liberation libappindicator3-1 libasound2 libatk-bridge2.0-0 libatk1.0-0 libcups2 libdbus-1-3 libdrm2 libgbm1 libgtk-3-0 libnspr4 libnss3 libx11-xcb1 libxcomposite1 libxdamage1 libxrandr2 xdg-utils --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

# Crea el directorio de la app
WORKDIR /usr/src/app

# Copia los archivos de la app
COPY package*.json ./

# Instala las dependencias de la app
RUN npm install --production

# Copia el resto del código
COPY . .

# Expone el puerto de la app
EXPOSE 10000

# Comando para iniciar la app
CMD ["node", "server.js"] 