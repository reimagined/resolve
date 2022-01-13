---
id: request-middleware
title: Request Middleware
description: Middleware implements intermediate logic that can modify the response object or handle errors before they are passed to the callback function.
---

The [@resolve-js/client](#resolve-client-library) and [@resolve-js/react-hooks](#resolve-react-hooks-library) libraries allow you to use request middleware to extend the client's functionality. Middleware implements intermediate logic that can modify the response object or handle errors before they are passed to the callback function.

Use a command's or query's `middleware` option to specify middleware:

#### @resolve-js/client:

```js
client.query(
  {
    name: "MyReadModel",
    resolver: "all"
  },
  {
    middleware: {
      response: [
        // An array of middleware that runs on server response
        createMyResponseMiddleware({
          // Middleware options
        }),
        ...
      ],
      error: [
        // An array of middleware that runs when there is a server error
        createMyErrorMiddleware({
          // Middleware options
        }),
        ...
      ]
    }
  },
  (error, result) => {
    ...
  }
})
```

#### @resolve-js/react-hooks:

```js
const myQuery = useQuery(
  {
    name: 'MyReadModel',
    resolver: 'all'
  },
  {
    middleware: {
      response: [
        // An array of middleware that runs on server response
        createMyResponseMiddleware({
          // Middleware options
        }),
        ...
      ]
      error: [
        // An array of middleware that runs on server error
        createMyErrorMiddleware({
          // Middleware options
        }),
        ...
      ]
    }
  },
  (error, result) => {
    ...
  }
```

Multiple middleware functions are run in the order they are specified in the options object.

## Available Middlewares

This section lists request middleware included into the @resolve-js/client package. The following middleware is available:

| Name                                  | Description                                               |
| ------------------------------------- | --------------------------------------------------------- |
| [`parseResponse`](#parseresponse)     | Deserializes the response data if it contains valid JSON. |
| [`retryOnError`](#retryonerror)       | Retries the request if the server responds with an error. |
| [`waitForResponse`](#waitforresponse) | Validates the response and retries if validation fails.   |

### `parseResponse`

Deserializes the response data if it contains valid JSON. If the data is not JSON, the original string is kept. Initialized by the `createParseResponseMiddleware` factory function.

This middleware has no options. You can add it to a request as shown below:

```js
import { createParseResponseMiddleware } from '@resolve-js/client'
...

const { data } = await client.query(
  {
    name: 'articles',
    resolver: 'all'
  },
  {
    middleware: {
      response: [createParseResponseMiddleware()]
    }
  }
)
```

### `retryOnError`

Retries the request if the server responds with an error. Initialized by the `createRetryOnErrorMiddleware` factory function.

The `retryOnError` middleware has the following options:

| Option Name | Description                                                          |
| ----------- | -------------------------------------------------------------------- |
| `attempts`  | The number of retries if the server responds with an error.          |
| `errors`    | An array of error codes that are allowed to trigger a retry.         |
| `debug`     | If set to `true`, the middleware logs errors in the browser console. |
| `period`    | The time between retries specified in milliseconds.                  |

You can add the `retryOnError` middleware to a request as shown below:

```js
import { createRetryOnErrorMiddleware } from '@resolve-js/client'
...

client.command(
  {
    aggregateName: 'Chat',
    type: 'postMessage',
    aggregateId: userName,
    payload: message
  },
  {
    middleware: {
      error: [
        createRetryOnErrorMiddleware({
          attempts: 3,
          errors: [500],
          debug: true,
          period: 500
        })
      ]
    }
  },
  err => {
    if (err) {
      console.warn(`Error while sending command: ${err}`)
    }
  }
)
```

### `waitForResponse`

Validates the response and retries if validation fails. This allows you to check whether the response contains the latest data or wait for the Read Model to update.

Initialized by the `createWaitForResponseMiddleware` factory function.

The `waitForResponse` middleware has the following options:

| Option Name | Description                                                          |
| ----------- | -------------------------------------------------------------------- |
| `attempts`  | The number of retries if validation fails.                           |
| `debug`     | If set to `true`, the middleware logs errors in the browser console. |
| `period`    | The time between retries specified in milliseconds.                  |
| `validator` | An async function that validates the response.                       |

You can add the `retryOnError` middleware to a request as shown below:

```js
import { createWaitForResponseMiddleware } from '@resolve-js/client'
...

const { data } = await client.query(
  {
    name: 'users',
    resolver: 'userById',
    args: {
      id: userId
    }
  },
  {
    middleware: {
      response: [
        createWaitForResponseMiddleware({
          attempts: 3,
          debug: true,
          period: 1,
          validator: async (response, confirm) => {
            if (response.ok) {
              const result = await response.json()
              if (result.data[userId]) {
                confirm(result)
              }
            }
          }
        })
      ]
    }
  }
)
```

## Implement Custom Middleware

You can define custom middleware as follows:

```js
const myMiddleware = async (
  options, // Options passed to the factory function.
  response, // The second argument is either a response or error.
  params // Contains API you can use in your middleware implementation. See the API table below.
) => {
  // Put your middleware logic here
}

// Export the factory function.
export const createMyMiddleware = (options) =>
  waitForResponse.bind(null, options)
```

The `params` object exposes the following API:

| Field Name     | Description                                                                 |
| -------------- | --------------------------------------------------------------------------- |
| `fetch`        | A JavaScript fetch function you can use to perform arbitrary HTTP requests. |
| `info`         | An object that describes the current request.                               |
| `init`         | An object that is the fetch function's `init` parameter.                    |
| `repeat`       | A function you can call to repeat the current request.                      |
| `end`          | Call this function to commit the middleware execution result or error.      |
| `state`        | A state object passed between middleware functions.                         |
| `deserializer` | Returns a deserealized object from a string.                                |
| `jwtProvider`  | Used to get and set the JSON Web Token.                                     |
