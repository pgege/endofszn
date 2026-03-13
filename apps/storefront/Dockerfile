FROM node:22-alpine

WORKDIR /home/user

RUN corepack enable

COPY apps/storefront/package.json ./
COPY yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn
RUN yarn install

COPY apps/storefront/ ./

EXPOSE 3000

CMD ["yarn", "next", "dev", "--port", "3000"]
