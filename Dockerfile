FROM node:16-alpine as build
RUN apk add --no-cache build-base git cmake zstd-dev curl-dev sqlite-dev
WORKDIR /usr/src/app
RUN npx degit mlin/sqlite_zstd_vfs
RUN cmake -DCMAKE_BUILD_TYPE=Release -B build && cmake --build build -j $(nproc)

FROM node:16-alpine
ENV NODE_ENV=production
RUN apk add --no-cache redis zstd libcurl
WORKDIR /usr/src/app
RUN chown node:node .
USER node
COPY --chown=node:node package*.json ./
RUN npm ci 
COPY --chown=node:node . .
COPY --chown=node:node --from=build /usr/src/app/build/zstd_vfs.so .
EXPOSE 5000
CMD redis-server --save "" --appendonly no & node server.js
