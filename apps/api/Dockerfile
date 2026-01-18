FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json yarn.lock ./
COPY apps/api/package.json ./apps/api/
RUN yarn install --immutable

COPY apps/api ./apps/api
COPY tsconfig.base.json ./

WORKDIR /app/apps/api
RUN npx prisma generate
RUN yarn build

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./
COPY --from=builder /app/apps/api/prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

CMD ["node", "dist/main.js"]
