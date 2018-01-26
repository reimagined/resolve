# `mongo-es-speed`

This package provides speed and memory usage benchmark for `resolve-storage-mongo` package.

It requires "live" (non-mocked, etc.) mongodb database.
You can specify connection parameters via `MONGODB_HOST` and `MONGODB_COLLECTION_NAME` environment variables.

Or you can specify full `MONGODB_CONNECTION_URL` environment variable to customize connection string.

## Usage

```bash
yarn install
yarn start
```

## Configuration

You can set following configuration parameters in the `config.js` file:

Event count in every generation phase

```js
const BENCHMARK_SERIES = [0, 10000, 30000, 100000, 300000, 1000000];
```

Event types that can be useful for following database inspection

```js
const GENERATED_EVENT_TYPES = [
    'Event1Raised',
    'Event2Raised',
    'Event3Raised',
    'Event4Raised',
    'Event5Raised',
    'Event6Raised',
    'Event7Raised'
];
```

Synthetic event payload fields count

```js
const PAYLOAD_ELEMENTS_COUNT = 3;
```

Average synthetic event payload fields content length

```js
const PAYLOAD_ELEMENT_SIZE = 100;
```
