FROM node:22-alpine

WORKDIR /app

COPY api/api/package*.json ./

RUN npm ci --omit=dev

COPY api/api/ .

COPY artifacts /artifacts

EXPOSE 3001

CMD ["npm", "start"]
