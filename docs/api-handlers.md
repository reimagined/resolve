---
id: api-handlers
title: API Handlers
description: Use API Handlers to provide your reSolve server with the capability to handle arbitrary HTTP requests.
---

Use API Handlers to provide your reSolve server with the capability to handle arbitrary HTTP requests. ReSolve API handlers have the following general structure:

**common/api-handlers/my-api-handler.js:**

```js
export default async (req, res) => {
  // ...
}
```

The handler function takes two parameters - the [request](#request) and [response](#response).

## Request

The `req` object represents the HTTP request. This object exposes properties that provide access to the request query string, parameters, body, HTTP headers, etc.

The request provides the following interface:

```js
{
  adapter: "express" | "awslambda",
  method: "GET" | "HEAD" | "POST" | "PUT" | "DELETE" | "CONNECT" | "OPTIONS" | "TRACE" | "PATCH",
  path: String,
  body: String,
  cookies: Object<key, value>,cd
  <key, value>,
  query: Object<key, value>,
  resolve: Object<key, value>
}
```

The request's `resolve` field is a reSolve context object that provides access to reSolve API and metadata. Through this object, you can use reSolve-specific API:

```js
const getPersonalKey = async (req, res) => {
    await req.resolve.executeCommand({
      ...
    });
    res.end();
  }
```

> **Note:** The `resolve` object contains resources, such as database connections, that are disposed after the API handler completes to prevent leaks. For this reason, you should not use the `resolve` object in code with delayed execution that may run after the API handler completes.

## Response

The `res` object represents the server's response to the HTTP request.

The response object provides the following interface:

```js
{
  status(code),
  getHeader(key),
  setHeader(key, value),
  text([content] [, encoding]),
  json([content]),
  end([content] [, encoding]),
  file(content, filename [, encoding]),
  redirect([status,] path),
  cookie(name, value [, options]),
  clearCookie(name [, options])
}
```

## Configuration

An API handler should be registered in the `apiHandlers` section of the application's configuration file.

**config.app.js:**

```js
const appConfig = {
  ...
  apiHandlers: [
    {
      path: 'my-api-handler',
      handler: 'common/api-handlers/my-api-handler.js',
      method: 'GET'
    }
  ]
}
export default appConfig
```

The configuration object specifies the following options:

| Option  | Description                                                                                                                                        |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Path    | The URL path for which the handler is invoked. The path is specified in the [route-trie](https://www.npmjs.com/package/route-trie) router's format |
| Handler | The path to the file that contains the handler's definition.                                                                                       |
| Method  | The HTTP method to handle.                                                                                                                         |

Refer to the [Application Configuration](application-configuration.md) topic for more information.

## Custom Config Options

The code below demonstrates how to pass custom options from the application's config file to an API handler:

```js title="config.app.js"
apiHandlers: [
  {
    path: '/api/myapihandler',
    handler: {
      module: 'common/api-handlers/myApiHandler.js',
      options: {
        option1: 'value1',
        option2: 'vlaue2',
      },
    },
    method: 'GET',
  },
]
```

When this config format is used, the file that defines the API handler should export a factory function that takes `options` as an argument and returns the handler function:

```js title="common/api-handlers/myApiHandler.js"
const myApiHandler = ({ option1, option2 }) => async (req, res) => {
  // ...
}

export default myApiHandler
```

## Usage

### Send Text

```js
export default async (req, res) => {
  const { username } = JSON.parse(req.body)

  res.text(`Hello ${username}!`)
}
```

### Send JSON

```js
export default async (req, res) => {
  const { username } = JSON.parse(req.body)

  res.json({
    id: uuid(),
    username,
  })
}
```

### Send File

```js
export default async (req, res) => {
  const { id } = req.query

  const user = await getUserById(id)

  res.file(JSON.stringify(user), 'user.json')
}
```

### Set Cookies

```js
export default async (req, res) => {
  res.cookie('expireTime', Date.now() + 1000 * 60 * 60)

  res.end()
}
```

### Redirect

```js
export default async (req, res) => {
  res.redirect('/settings')
}
```

### Custom Status

```js
export default async (req, res) => {
  if (!checkAccess(req.query)) {
    res.status(401)
    res.end('Access denied')
    return
  }

  res.end('Ok')
}
```
