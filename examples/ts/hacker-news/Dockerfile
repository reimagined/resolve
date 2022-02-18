# Build stage: install all dependencies and build app
FROM node:14.17-alpine as build

WORKDIR /src

COPY package.json package.json

COPY .babelrc .babelrc
COPY tsconfig.json tsconfig.json

RUN yarn install --ignore-scripts

COPY run.ts run.ts
COPY config.adjust-webpack.ts config.adjust-webpack.ts
COPY config.app.ts config.app.ts
COPY config.cloud.common.ts config.cloud.common.ts
COPY config.cloud.replica.ts config.cloud.replica.ts
COPY config.cloud.ts config.cloud.ts
COPY config.dev.common.ts config.dev.common.ts
COPY config.dev.replica.ts config.dev.replica.ts
COPY config.dev.ts config.dev.ts
COPY config.prod.ts config.prod.ts
COPY config.docker.ts config.docker.ts
COPY config.test-functional.ts config.test-functional.ts
COPY types.ts types.ts
COPY auth auth
COPY client client
COPY common common
COPY import import
COPY static static

RUN yarn build:docker

# Dependencies stage: install production dependencies
FROM node:14.17-alpine as dependencies

WORKDIR /src

COPY package.json package.json

RUN yarn install --ignore-scripts --production

# Main stage: copy production dependencies, build and static files
FROM node:14.17-alpine

COPY static static
COPY --from=dependencies /src .
COPY --from=build /src/dist dist

EXPOSE 3000

CMD ["node", "dist/common/local-entry/local-entry.js"]
