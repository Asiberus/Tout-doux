FROM node:22-alpine as build-stage

ARG ARG_VERSION
ENV VERSION=$ARG_VERSION

WORKDIR  /frontend

COPY --chown=node:node ./.conf/production/frontend/set-meta-at-build.sh ./set-meta-at-build.sh

RUN chown node:node /frontend && \
    mkdir -p /frontend/node_modules && \
    chown -R node:node /frontend && \
    chmod +x ./set-meta-at-build.sh && \
    apk add --update python3 make g++ && \
    rm -rf /var/cache/apk/*

USER node
COPY --chown=node:node ./frontend/package.json ./frontend/yarn.lock ./
RUN yarn install --frozen-lockfile

COPY --chown=node:node ./frontend .
RUN ./set-meta-at-build.sh && \
    yarn build

FROM nginx:1.24-alpine as production-stage

ENV NGINX_ENVSUBST_TEMPLATE_SUFFIX=.tpl

COPY --from=build-stage /frontend/dist /usr/share/nginx/html
COPY ./.conf/production/frontend/default.conf.tpl /etc/nginx/templates/default.conf.tpl
COPY ./.conf/production/frontend/uwsgi_params /etc/nginx/uwsgi_params
COPY ./.conf/production/frontend/set-meta-at-run.sh /docker-entrypoint.d/40-set-meta-at-run.sh

RUN mkdir -p /vol/static && \
    chmod 755 /vol/static && \
    chmod +x /docker-entrypoint.d/40-set-meta-at-run.sh && \
    mkdir -p /var/log/nginx/front && \
    mkdir -p /var/log/nginx/api && \
    touch /var/log/nginx/front/access.log && \
    touch /var/log/nginx/front/error.log && \
    touch /var/log/nginx/api/access.log && \
    touch /var/log/nginx/api/error.log

CMD ["nginx", "-g", "daemon off;"]
