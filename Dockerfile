FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx vite build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 7860
RUN sed -i 's/listen\s*80;/listen 7860;/g' /etc/nginx/conf.d/default.conf
CMD ["nginx", "-g", "daemon off;"]
