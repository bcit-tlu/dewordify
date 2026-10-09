## Build stage
FROM node:24.18.0-alpine3.23 AS builder

WORKDIR /app

COPY package*.json ./

# prepare (build:cli) needs source files, which are copied below
RUN npm ci --ignore-scripts

COPY . /app

RUN npm run build


## Release/production
FROM nginxinc/nginx-unprivileged:alpine3.23-perl

LABEL maintainer=courseproduction@bcit.ca
LABEL org.opencontainers.image.source="https://github.com/bcit-ltc/dewordify"
LABEL org.opencontainers.image.description="Dewordify converts MS Word documents into HTML pages for online courses."

COPY conf.d/default.conf /etc/nginx/conf.d/default.conf

WORKDIR /usr/share/nginx/html

COPY --from=builder /app/dist-web/ ./
