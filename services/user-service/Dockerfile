FROM node:20-alpine
WORKDIR /app
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy and install service dependencies
COPY services/user-service/package*.json ./
RUN npm install --production

# Copy shared kafka module
COPY shared/ ./shared/

# Copy service source
COPY services/user-service/ .

# Generate Prisma client
RUN npx prisma generate

RUN chown -R appuser:appgroup /app
USER appuser
CMD ["npm", "start"]
