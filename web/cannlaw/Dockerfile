# Build stage
FROM node:20-alpine AS build
WORKDIR /app

ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Copy shared-ui first
COPY web/shared-ui ./web/shared-ui
WORKDIR /app/web/shared-ui
RUN npm install
RUN npm run build

# Copy cannlaw project
WORKDIR /app/web/cannlaw
COPY web/cannlaw/package*.json ./
RUN npm install
COPY web/cannlaw .
RUN npm run build

# Production stage
FROM nginx:stable-alpine
COPY --from=build /app/web/cannlaw/dist /usr/share/nginx/html
COPY web/cannlaw/nginx.prod.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
