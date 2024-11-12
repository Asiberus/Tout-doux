FROM node:14.18.1-alpine3.12

ARG ARG_VERSION
ARG ARG_API_URL
ENV VERSION=$ARG_VERSION
ENV API_URL=$ARG_API_URL
ENV NODE_ENV=development

WORKDIR  /frontend

COPY --chown=node:node ./.conf/development/frontend/setup-config.sh ./setup-config.sh

# Todo : see if we can remove python3, make and g++ after npm install
RUN chown node:node /frontend && \
    mkdir -p /frontend/node_modules &&  \
    chown -R node:node /frontend && \
    chmod +x ./setup-config.sh && \
    apk add --update python3 make g++ && \
    rm -rf /var/cache/apk/*

USER node
COPY --chown=node:node ./frontend/package.json ./frontend/yarn.lock ./
RUN yarn install

COPY --chown=node:node ./frontend .
RUN ./setup-config.sh

CMD ["yarn", "dev"]
