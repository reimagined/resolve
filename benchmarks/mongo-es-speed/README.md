# `mongo-es-speed`

This package provides speed and memory usage benchmark for `resolve-es-mongo` package.

## Usage

To run benchmark, perform `npm install` and then `npm start` commands.

This package requires "live" (non-mocked, etc) mongodb database. You can specify connection
parameters via `MONGODB_HOST` and `MONGODB_COLLECTION_NAME` environment variables.

Alternalivery, you can specify full `MONGODB_CONNECTION_URL` environment variable to
customize connection string.

## Configuration

You can also adjust following configuration parameters, which located on `config.js` file:

```js
const BENCHMARK_SERIES = [0, 10000, 30000, 100000, 300000, 1000000];
```
Used for setup event count in every generation phase (Phase quantity is equal to this array size).

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
Used for specify event names, which can be useful for following database inspection.

```js
const PAYLOAD_ELEMENTS_COUNT = 3;
```
Used for specify synthetic event payload fields count.

```js
const PAYLOAD_ELEMENT_SIZE = 100;
```
Used for specify average synthetic event payload fields content length.
