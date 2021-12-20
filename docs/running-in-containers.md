---
id: running-in-containers
title: Running in Containers
---

It is possible to run a reSolve in a docker container. This article describes how to prepare an application and run in as a part of a Docker Compose setup along with additional containers that serve the following purposes:

- A `postgres` container is used to store the application's data.
- An `nginx` container is used as a reserve proxy server to answer HTTP requests.

Follow the steps below to run a reSolve application in a Docker container.

## 1. Configure the reSolve Application

Add a separate application configuration file used to build the application as a part of a Docker image:

```js title="/config.docker.js"
import { declareRuntimeEnv } from '@resolve-js/scripts'

const dockerConfig = {
  mode: 'production',
  runtime: {
    module: '@resolve-js/runtime-single-process',
    options: {
      host: declareRuntimeEnv('HOST', 'localhost'),
      port: declareRuntimeEnv('PORT', '3000'),
    },
  },
  eventstoreAdapter: {
    module: '@resolve-js/eventstore-postgresql',
    options: {
      databaseName: declareRuntimeEnv('RESOLVE_EVENT_STORE_DATABASE_NAME'),
      host: declareRuntimeEnv('RESOLVE_EVENT_STORE_CLUSTER_HOST'),
      port: declareRuntimeEnv('RESOLVE_EVENT_STORE_CLUSTER_PORT'),
      user: declareRuntimeEnv('RESOLVE_USER'),
      password: declareRuntimeEnv('RESOLVE_USER_PASSWORD'),
      database: 'postgres',
    },
  },
  readModelConnectors: {
    default: {
      module: '@resolve-js/readmodel-postgresql',
      options: {
        databaseName: declareRuntimeEnv('RESOLVE_READMODEL_DATABASE_NAME'),
        host: declareRuntimeEnv('RESOLVE_READMODEL_CLUSTER_HOST'),
        port: declareRuntimeEnv('RESOLVE_READMODEL_CLUSTER_PORT'),
        user: declareRuntimeEnv('RESOLVE_USER'),
        password: declareRuntimeEnv('RESOLVE_USER_PASSWORD'),
        database: 'postgres',
      },
    },
    hackerNews: {
      module: '@resolve-js/readmodel-postgresql',
      options: {
        databaseName: declareRuntimeEnv('RESOLVE_READMODEL_DATABASE_NAME'),
        host: declareRuntimeEnv('RESOLVE_READMODEL_CLUSTER_HOST'),
        port: declareRuntimeEnv('RESOLVE_READMODEL_CLUSTER_PORT'),
        user: declareRuntimeEnv('RESOLVE_USER'),
        password: declareRuntimeEnv('RESOLVE_USER_PASSWORD'),
        database: 'postgres',
      },
    },
    comments: {
      module: '@resolve-js/readmodel-postgresql',
      options: {
        databaseName: declareRuntimeEnv('RESOLVE_READMODEL_DATABASE_NAME'),
        host: declareRuntimeEnv('RESOLVE_READMODEL_CLUSTER_HOST'),
        port: declareRuntimeEnv('RESOLVE_READMODEL_CLUSTER_PORT'),
        user: declareRuntimeEnv('RESOLVE_USER'),
        password: declareRuntimeEnv('RESOLVE_USER_PASSWORD'),
        database: 'postgres',
      },
    },
    elasticSearch: {
      module: 'common/read-models/elastic-search-connector.ts',
      options: {
        /*
        host: '<your-production-elastic-search-host>'
        */
      },
    },
  },
  jwtCookie: {
    name: 'jwt',
    maxAge: 31536000000,
  },
}

export default dockerConfig
```

Register the added configuration file in `run.js`:

```js title="/run.js"
import dockerConfig from './config.docker'
...
void (async () => {
  try {
    ...
    switch (launchMode) {
      ...
      case 'build:docker': {
        const resolveConfig = merge(baseConfig, dockerConfig)
        await build(resolveConfig, adjustWebpackConfigs)
        break
      }
    }
  } catch (error) {
    await stop(error)
  }
})()
```

Register a `"build:docker"` script in the application's `package.json` file:

```json title="/package.json"
...
"scripts": {
    ...
    "build:docker": "ts-node run.ts build:docker",
    ...
}
...
```

## 2. Configure PostgreSQL

The official [PostgreSQL](https://hub.docker.com/_/postgres/) docker image runs SQL scripts found in the `/docker-entrypoint-initdb.d/` folder to initialize the hosted databases.

To initialize the database credentials and schemas required to run reSolve, create a directory to mount as the `/docker-entrypoint-initdb.d/` volume and add the following script to this directory:

:::caution
The code sample below contains example PostgreSQL user credentials. Make sure to replace these credentials in your application.
:::

```sql title="/docker/volumes/postgres/docker-entrypoint-initdb.d/init-schemas.sql"
\c postgres;
-- Add user credetials for your reSolve applciation.
CREATE USER "hn-user";
ALTER USER "hn-user" PASSWORD 'QweZxc123';

-- Grant the created user the required rights.
CREATE SCHEMA "event-store";
GRANT USAGE ON SCHEMA "event-store" TO "hn-user";
GRANT ALL ON SCHEMA "event-store" TO "hn-user";
GRANT ALL ON ALL TABLES IN SCHEMA "event-store" TO "hn-user";
GRANT ALL ON ALL SEQUENCES IN SCHEMA "event-store" TO "hn-user";
GRANT ALL ON ALL FUNCTIONS IN SCHEMA "event-store" TO "hn-user";
ALTER SCHEMA "event-store" OWNER TO "hn-user";

CREATE SCHEMA "read-store";
GRANT USAGE ON SCHEMA "read-store" TO "hn-user";
GRANT ALL ON SCHEMA "read-store" TO "hn-user";
GRANT ALL ON ALL TABLES IN SCHEMA "read-store" TO "hn-user";
GRANT ALL ON ALL SEQUENCES IN SCHEMA "read-store" TO "hn-user";
GRANT ALL ON ALL FUNCTIONS IN SCHEMA "read-store" TO "hn-user";
ALTER SCHEMA "read-store" OWNER TO "hn-user";
```

## 3. Configure Nginx

To configure an Nginx image, create a directory to be mounted as a `/etc/nginx/conf.d` volume. In this directory, create a `default.conf` file with the reverse proxy server configuration that suite your requirements. For example:

```txt title="/docker/volumes/nginx/conf.d/default.conf"
server {
  listen 80;

  location / {
    proxy_pass http://server:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
  }
}
```

## 4. Prepare the Dockerfile

The example Dockerfile below demonstrates how to build a Docker image for a reSolve application based on official `node` image.
The image is built in stages to optimize for the image size.

```txt title="/Dockerfile"
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
```

## 5. Configure Docker Compose

Add a Docker Compose configuration file used to run your reSolve application's container along with PostgreSQL and Nginx containers:

:::caution
The code sample below contains example PostgreSQL user and admin credentials. Make sure to replace these credentials in your application.
:::

```yaml title="/docker-compose.yml"
version: '3'
services:
  postgres:
    image: postgres:14.1
    environment:
      POSTGRES_USER: 'hn-admin'
      POSTGRES_PASSWORD: 'pRWGAqCEq4'
    volumes:
      - ./docker/volumes/postgres/docker-entrypoint-initdb.d:/docker-entrypoint-initdb.d:ro

  server:
    build:
      dockerfile: ./Dockerfile
      context: .
    environment:
      HOST: '0.0.0.0'
      RESOLVE_EVENT_STORE_DATABASE_NAME: 'event-store'
      RESOLVE_EVENT_STORE_CLUSTER_HOST: 'postgres'
      RESOLVE_EVENT_STORE_CLUSTER_PORT: '5432'
      RESOLVE_READMODEL_DATABASE_NAME: 'read-store'
      RESOLVE_READMODEL_CLUSTER_HOST: 'postgres'
      RESOLVE_READMODEL_CLUSTER_PORT: '5432'
      RESOLVE_USER: 'hn-user'
      RESOLVE_USER_PASSWORD: 'QweZxc123'
    depends_on:
      - postgres

  nginx:
    image: nginx:1.17
    ports:
      - '3000:80'
    depends_on:
      - server
    volumes:
      - ./docker/volumes/nginx/conf.d:/etc/nginx/conf.d:ro

networks:
  default:
    driver: bridge
```

You can define an additional configuration file to use in the production environment. For example, the sample config below demonstrates how to define a volume for PostgreSQL data in production:

```yaml title="/docker-compose-production.yml"
version: '3'
services:
  postgres:
    volumes:
      - ./docker/volumes/postgres/data:/var/lib/postgresql/data
```

## 6. Build the Image and Run the Container

Use the following console input to download the official PostgreSQL image and run it in Docker Compose so it runs the initialization script:

```sh
docker-compose up -d postgres
```

To build and run your application, type:

```sh
docker-compose up -d
```

To use the production configuration, type:

```sh
docker-compose -f docker-compose.yml -f docker-compose-production.yml up -d
```

## See the Example

The [Hacker News](https://github.com/reimagined/resolve/tree/dev/examples/js/hacker-news) example project contains all configuration files required to build a docker image and run it with Docker Compose.
