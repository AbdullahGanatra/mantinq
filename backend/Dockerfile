FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy prisma schema
COPY prisma ./prisma/
RUN npx prisma generate

# Copy source
COPY . .

# Build
RUN npm run build

# Expose port
EXPOSE 5000

# Start
CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed && npm start"]
