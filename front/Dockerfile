# Stage 1: Build React app
FROM node:20-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Serve with nginx as an unprivileged user.
# The unprivileged image runs as uid 101 and listens on 8080 - a non-root
# process cannot bind port 80. docker-compose.yml carries the matching
# traefik ... loadbalancer.server.port=8080 label.
FROM nginxinc/nginx-unprivileged:1.29-alpine
COPY --from=builder /app/build /usr/share/nginx/html
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
