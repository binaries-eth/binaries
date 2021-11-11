FROM node:16.13-alpine

USER node
WORKDIR /home/node/app

COPY --chown=node . .
RUN npm i
ENV NODE_ENV production

EXPOSE 3000
CMD npm run start
