FROM node:22-alpine AS builder

WORKDIR /app

RUN corepack enable

COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn
COPY apps/medusa/package.json ./apps/medusa/
RUN yarn install

COPY apps/medusa ./apps/medusa
COPY tsconfig.base.json ./

WORKDIR /app/apps/medusa
RUN yarn build

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/apps/medusa/.medusa ./.medusa
COPY --from=builder /app/apps/medusa/medusa-config.ts ./
COPY --from=builder /app/apps/medusa/package.json ./
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 9000

CMD ["npx", "medusa", "start"]
