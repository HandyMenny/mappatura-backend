FROM node:14-alpine
ENV NODE_ENV=production
WORKDIR /usr/src/app
RUN chown node:node .
USER node
COPY --chown=node:node package*.json ./
RUN npm ci 
COPY --chown=node:node . .
EXPOSE 5000
CMD ["node", "server.js"]