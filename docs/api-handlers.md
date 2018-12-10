---
id: api-handlers
title: API handlers
---

## API Reference

```js
export default async (req, res) => {
  // ...
}
```

## Request

The `req` object represents the HTTP request and has properties for the request query string, parameters, body, HTTP headers, and so on.

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

The `res` object represents the HTTP response that an api handler sends when it gets an HTTP request.

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

## How to write an api handlers

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

## How to write a resolve config

```
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

See [Schema Resolve Config](../packages/core/resolve-scripts/configs/schema.resolve.config.json) for more information.
