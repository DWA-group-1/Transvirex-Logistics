FROM node:20-alpine

WORKDIR /app

# Copy dependency files first for layer caching
COPY package.json package-lock.json* ./

RUN npm install

COPY . .

EXPOSE 5173

# Run Vite dev server bound to all interfaces so Docker can expose it
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
