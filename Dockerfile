FROM node:22-slim

ENV NODE_ENV=production
WORKDIR /app

COPY --chown=node:node . .

USER node
EXPOSE 8080
CMD ["node", "server.js"]
