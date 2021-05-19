FROM node:16-alpine3.11 as builder

RUN mkdir -p /app
WORKDIR /app
COPY package.json . 
RUN npm install
RUN npm install -g @angular/cli
COPY . . 
RUN ng build --configuration production

# Runtime
FROM nginx:1.19.8-alpine
COPY --from=builder /app/dist/stockmon3-ui /usr/share/nginx/html
COPY ./docker/nginx.conf /etc/nginx/conf.d/default.conf