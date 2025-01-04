FROM node:20-bullseye

ARG ARG_VERSION
ARG ARG_API_URL
ENV VERSION=$ARG_VERSION
ENV API_URL=$ARG_API_URL
ENV NODE_ENV=development

WORKDIR  /frontend

COPY --chown=node:node ./.conf/development/frontend/setup-config.sh ./setup-config.sh

# Todo : see if we can remove python3, make and g++ after yarn install
RUN mkdir -p /frontend/node_modules &&  \
    chmod +x ./setup-config.sh && \
    apt install python3 make g++ && \
#    rm -rf /var/cache/apt/* && \
    mkdir ./.yarn-cache && \
    chown -R node:node /frontend

USER node
#COPY --chown=node:node ./frontend/package.json ./frontend/yarn.lock ./
COPY --chown=node:node ./frontend/package.json ./
RUN #yarn install --immutable --cache-folder /frontend/.yarn-cache
RUN #yarn install --cache-folder /frontend/.yarn-cache
RUN yarn install
RUN yarn cache clean

#RUN yarn add @rollup/rollup-linux-arm64-musl

COPY --chown=node:node ./frontend .
RUN ./setup-config.sh

CMD ["yarn", "dev"]
#CMD ["sleep","3600"]
#ENTRYPOINT ["/bin/sh"]
#ENTRYPOINT ["bash"]

