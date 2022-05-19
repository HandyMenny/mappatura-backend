FROM node:16-alpine
ENV NODE_ENV=production
RUN apk add --no-cache redis
WORKDIR /usr/src/app
RUN chown node:node .
USER node
COPY --chown=node:node package*.json ./
RUN npm ci 
COPY --chown=node:node . .
EXPOSE 5000
CMD redis-server & node server.js