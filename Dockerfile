FROM node:15.12.0-alpine3.10 as builder

RUN mkdir -p /app
WORKDIR /app
COPY package.json . 
RUN npm install
RUN npm install --save @angular/cli
COPY . . 
RUN npm run build --prod

# Runtime
FROM nginx:1.19.8-alpine
COPY --from=builder /app/dist/stockmon3-ui /usr/share/nginx/html
COPY ./docker/nginx.conf /etc/nginx/conf.d/default.conf