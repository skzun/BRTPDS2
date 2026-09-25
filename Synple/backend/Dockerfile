# Imagem base oficial do Node.js (leve e rápida)
FROM node:20-alpine

# Define diretório de trabalho
WORKDIR /app

# Copia arquivos de dependências
COPY package*.json ./

# Instala dependências de produção
RUN npm install --production

# Copia todo o código-fonte do backend
COPY . .

# Expõe a porta do backend
EXPOSE 3001

# Comando de inicialização: aguarda e executa inicialização/migrações do banco e sobe o servidor
CMD ["sh", "-c", "node src/db/init-db.js && node src/server.js"]
