FROM node:14.18.1-alpine

ARG ARG_VERSION
ARG ARG_API_URL
ENV VERSION=$ARG_VERSION
ENV API_URL=$ARG_API_URL
ENV NODE_ENV=development

WORKDIR  /frontend

COPY --chown=node:node ./.conf/development/frontend/setup-config.sh ./setup-config.sh

RUN chown node:node /frontend && \
    mkdir -p /frontend/node_modules &&  \
    chown -R node:node /frontend && \
    chmod +x ./setup-config.sh

USER node
COPY --chown=node:node ./frontend/package.json ./frontend/package-lock.json ./
RUN npm install

COPY --chown=node:node ./frontend .
RUN ./setup-config.sh

CMD ["npm", "run", "serve", "--host=0.0.0.0"]
