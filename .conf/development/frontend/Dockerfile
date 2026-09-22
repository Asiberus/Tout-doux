FROM node:22-alpine

ENV NODE_ENV=development

WORKDIR /frontend
RUN chown node:node /frontend

USER node

COPY --chown=node:node ./frontend/package.json ./frontend/yarn.lock ./
RUN yarn install --frozen-lockfile && yarn cache clean

COPY --chown=node:node ./frontend .

CMD ["yarn", "dev"]
