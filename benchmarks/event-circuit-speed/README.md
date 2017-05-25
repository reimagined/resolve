# `event-circuit-speed`

This package provides full-circuit speed and memory usage benchmark for `resolve-command` and `resolve-query` packages.
Underliying store package is `resolve-es-mongo` and bus proveder is `resolve-bus-memory`.

It requires "live" (non-mocked, etc.) mongodb database.
You can specify connection parameters via `MONGODB_HOST` and `MONGODB_COLLECTION_NAME` environment variables.

Or you can specify full `MONGODB_CONNECTION_URL` environment variable to customize connection string.

## Usage

```bash
npm install
npm start
```

## Configuration

You can set following configuration parameters in the `config.js` file:

Event count in every generation phase

```js
const BENCHMARK_SERIES = [0, 10000, 30000, 100000, 300000, 1000000];
```
