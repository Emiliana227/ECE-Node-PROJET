# Image Node.js légère
FROM node:18-alpine

# Dossier de travail
WORKDIR /app

# Copier les fichiers package
COPY package*.json ./

# Installer les dépendances
RUN npm install

# Copier tout le projet
COPY . .

# Exposer le port 3000
EXPOSE 3000

# Lancer l'application
CMD ["node", "index.js"]