---
id: api-handlers
title: API Handlers
---

Use API Handlers to provide your reSolve server with the capability to handle arbitrary HTTP requests.

## API Reference

ReSolve API handlers have the following general structure:

##### common/api-handlers/my-api-handler.js:

```js
export default async (req, res) => {
  // ...
}
```

The handler function takes two parameters - the [request](#request) and [response](#response).

### Request

The `req` object represents the HTTP request. This object exposes properties that provide access to the request query string, parameters, body, HTTP headers, etc.

The request provides the following interface:

```js
{
  adapter: "express" | "awslambda",
  method: "GET" | "HEAD" | "POST" | "PUT" | "DELETE" | "CONNECT" | "OPTIONS" | "TRACE" | "PATCH",
  path: String,
  body: String,
  cookies: Object<key, value>,cd
  headers: Object<key, value>,
  query: Object<key, value>
}
```

### Response

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

### Configuration

An API handler should be registered in the `apiHandlers` section of the application's configuration file.

##### config.app.js:

```js
const appConfig = {
  ...
  apiHandlers: [
    {
      path: 'my-api-handler',
      controller: 'common/api-handlers/my-api-handler.js',
      method: 'GET'
    }
  ]
}
export default appConfig
```

The configuration object specifies the following options:

| Option     | Description                                                                     |
| ---------- | ------------------------------------------------------------------------------- |
| Path       | The URL path for which the handler is invoked. This path is relative to `/api`. |
| Controller | The path to the file that contains the handler's definition.                    |
| Method     | The HTTP method to handle.                                                      |

Refer to the [Schema Resolve Config](https://github.com/reimagined/resolve/blob/master/packages/core/resolve-scripts/configs/schema.resolve.config.json) file for more information.

## Implementation Examples

- Send Text

```js
export default async (req, res) => {
  const { username } = JSON.parse(req.body)

  res.text(`Hello ${username}!`)
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
