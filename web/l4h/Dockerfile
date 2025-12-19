# Build stage
FROM node:20-alpine AS build
WORKDIR /app

# Copy shared-ui first
COPY web/shared-ui ./web/shared-ui
WORKDIR /app/web/shared-ui
RUN npm install
RUN npm run build

# Copy l4h project
WORKDIR /app/web/l4h
COPY web/l4h/package*.json ./
RUN npm install
COPY web/l4h .
RUN npm run build

# Production stage
FROM nginx:stable-alpine
COPY --from=build /app/web/l4h/dist /usr/share/nginx/html
COPY web/l4h/nginx.prod.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]