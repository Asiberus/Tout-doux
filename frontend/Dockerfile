FROM node:14.18.1-alpine
RUN mkdir /frontend && chown node:node /frontend
RUN mkdir -p /frontend/node_modules && chown -R node:node /frontend
WORKDIR  /frontend
USER node
COPY --chown=node:node package.json package-lock.json ./
RUN npm install
COPY --chown=node:node . .

CMD ["npm", "run", "serve", "--host=0.0.0.0"]
