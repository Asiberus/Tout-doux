FROM node:14.18.1-alpine as build-stage

ARG ARG_VERSION
ARG ARG_API_URL
ENV VERSION=$ARG_VERSION
ENV API_URL=$ARG_API_URL
ENV NODE_ENV=production

WORKDIR  /frontend

COPY --chown=node:node ./.conf/production/frontend/setup-config.sh ./setup-config.sh

RUN chown node:node /frontend && \
    mkdir -p /frontend/node_modules &&  \
    chown -R node:node /frontend && \
    chmod +x ./setup-config.sh

USER node
COPY --chown=node:node ./frontend/package.json ./frontend/package-lock.json ./
RUN npm install

COPY --chown=node:node ./frontend .
RUN ./setup-config.sh && \
    npm run build

FROM nginxinc/nginx-unprivileged:1-alpine as production-stage
ENV NGINX_ENVSUBST_TEMPLATE_SUFFIX=.tpl

COPY --from=build-stage /frontend/dist /usr/share/nginx/html
COPY ./.conf/production/frontend/default.conf.tpl /etc/nginx/templates/default.conf.tpl
COPY ./.conf/production/frontend/uwsgi_params /etc/nginx/uwsgi_params

USER root

RUN mkdir -p /vol/static && \
    chmod 755 /vol/static

USER nginx

CMD ["nginx", "-g", "daemon off;"]
