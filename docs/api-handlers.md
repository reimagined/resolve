---
id: api-handlers
title: API Handlers
---

## API Reference

ReSolve API handlers have the following general structure:

```js
export default async (req, res) => {
  // ...
}
```

The handler function takes two parameters - the [request](#request) and [response](#response).

## Request

The `req` object represents the HTTP request. This object exposes properties providing access to the request query string, parameters, body, HTTP headers, and so on.

The request provides the following interface:

```js
{
  adapter: "express" | "awslambda",
  method: "GET" | "HEAD" | "POST" | "PUT" | "DELETE" | "CONNECT" | "OPTIONS" | "TRACE" | "PATCH",
  path: String,
  body: String,
  cookies: Object<key, value>,
  headers: Object<key, value>,
  query: Object<key, value>
}
```

## Response

The `res` object represents the server response. It is sent by the API handler in response to the HTTP request.

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

## API Handler Implementation Examples

- Send Text

```js
export default async (req, res) => {
  const { username } = JSON.parse(req.body)

  res.text(`Hello ${username}!')
}
```

- Send JSON

```js
export default async (req, res) => {
  const { username } = JSON.parse(req.body)

  res.json({
    id: uuid(),
    username
  })
}
```

- Send File

```js
export default async (req, res) => {
  const { id } = req.query

  const user = await getUserById(id)

  res.file(JSON.stringify(user), 'user.json')
}
```

- Set Cookies

```js
export default async (req, res) => {
  res.cookie('expireTime', Date.now() + 1000 * 60 * 60)

  res.end()
}
```

- Redirect

```js
export default async (req, res) => {
  res.redirect('/settings')
}
```

- Custom status

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

## API Handler Configuration

```js
// run.js

import {
  defaultResolveConfig,
  watch
} from 'resolve-scripts'

import appConfig from './config.app'
import devConfig from './config.dev'
import prodConfig from './config.prod'
import testFunctionalConfig from './config.test_functional'

const launchMode = process.argv[2]

void (async () => {
  switch (launchMode) {
    case 'dev': {
      await watch({
        ...defaultResolveConfig,
        ...appConfig,
        ...devConfig,
        {
          apiHandlers: [
            {
              path: 'info',
              controller: 'api-handlers/info.js',
              method: 'GET'
            }
          ]
        }
      })
      break
    }
    // ...
  }
})().catch(error => {
  // eslint-disable-next-line no-console
  console.log(error)
})
```

Refer to the [Schema Resolve Config](https://github.com/reimagined/resolve/blob/master/packages/core/resolve-scripts/configs/schema.resolve.config.json) file for more information.
