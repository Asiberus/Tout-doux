FROM node:14.18.1-alpine3.12 as build-stage

ARG ARG_VERSION
ARG ARG_API_URL
ENV VERSION=$ARG_VERSION
ENV API_URL=$ARG_API_URL

WORKDIR  /frontend

COPY --chown=node:node ./.conf/production/frontend/setup-config.sh ./setup-config.sh

RUN chown node:node /frontend && \
    mkdir -p /frontend/node_modules && \
    chown -R node:node /frontend && \
    chmod +x ./setup-config.sh && \
    apk add --update python3 make g++ && \
    rm -rf /var/cache/apk/*

USER node
COPY --chown=node:node ./frontend/package.json ./frontend/package-lock.json ./
RUN npm install

COPY --chown=node:node ./frontend .
RUN ./setup-config.sh && \
    npm run build

FROM nginx:1.24-alpine as production-stage

ENV NGINX_ENVSUBST_TEMPLATE_SUFFIX=.tpl

COPY --from=build-stage /frontend/dist /usr/share/nginx/html
COPY ./.conf/production/frontend/default.conf.tpl /etc/nginx/templates/default.conf.tpl
COPY ./.conf/production/frontend/uwsgi_params /etc/nginx/uwsgi_params

RUN mkdir -p /vol/static && \
    chmod 755 /vol/static && \
    mkdir -p /var/log/nginx/front && \
    mkdir -p /var/log/nginx/api && \
    touch /var/log/nginx/front/access.log && \
    touch /var/log/nginx/front/error.log && \
    touch /var/log/nginx/api/access.log && \
    touch /var/log/nginx/api/error.log

CMD ["nginx", "-g", "daemon off;"]