FROM node:20-alpine
WORKDIR /app
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY gateway/package*.json ./
RUN npm install --production

COPY gateway/ .

RUN chown -R appuser:appgroup /app
USER appuser
CMD ["npm", "start"]
