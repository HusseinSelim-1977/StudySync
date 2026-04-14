FROM node:22-alpine
WORKDIR /app
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY services/availability-service/package*.json ./
RUN npm install --production

COPY shared/ ./shared/
COPY services/availability-service/ .

RUN npx prisma generate

RUN chown -R appuser:appgroup /app
USER appuser
CMD ["npm", "start"]
