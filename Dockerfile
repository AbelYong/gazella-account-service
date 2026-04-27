FROM node:24-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

FROM node:24-alpine AS runner

WORKDIR /app

ENV NODE_ENV=deployment

COPY package.json package-lock.json ./

RUN npm ci --ommit=dev

COPY --from=builder /app/dist ./dist

COPY ./drizzle ./drizzle

EXPOSE 5000

CMD ["node", "dist/index.js"]
