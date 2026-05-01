FROM node:24-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

FROM node:24-alpine AS runner-base
RUN addgroup -S account_service \
    && adduser -S account_service -G account_service

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci --ommit=dev

COPY --from=builder /app/dist ./dist

COPY ./drizzle ./drizzle

USER account_service

EXPOSE 5000

FROM runner-base AS development

ENV NODE_ENV=development

COPY --from=builder --chown=account_service:account_service /app/src ./src

CMD ["node", "dist/index.js"]

FROM runner-base AS production

ENV NODE_ENV=production

CMD ["node", "dist/index.js"]
