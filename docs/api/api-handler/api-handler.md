---
id: api-handler
title: API Handler
description: This article describes the structure of an API handler function and its arguments.
---

```mdx-code-block
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
```

An API handler is defined as follows:

<Tabs>
<TabItem value="withoutoptions" label="With Options" default>

```js
const myApiHandler = async (req, res) => {
  // ...
}

export default myApiHandler
```

</TabItem>
<TabItem value="withoptions" label="Without Options">

```js
const myApiHandler = (options) => async (req, res) => {
  // ...
}

export default myApiHandler
```

</TabItem>
</Tabs>

The handler receives a request and response objects. See the sections below for information on the API exposed through these objects.

### Request

:::info TypeScript Support

A request object has an associated TypeScript type:

- Type Name - `ResolveRequest`
- Package - `@resolve-js/runtime-base`

:::

The request object exposes the following fields:

| Field     | Description                                                                              |
| --------- | ---------------------------------------------------------------------------------------- |
| `resolve` | The [reSolve context](resolve-context.md) object that contains reSolve API and metadata. |
| `method`  | The request's HTTP method.                                                               |
| `path`    | The request URL path.                                                                    |
| `body`    | The request body.                                                                        |
| `cookies` | An object that contains the attached cookies as key-value pairs.                         |
| `headers` | An object that contains the request's HTTP headers as key-value pairs.                   |
| `query`   | An object that contains the request's query string parameters as key-value pairs.        |

### Response

:::info TypeScript Support

A response object has an associated TypeScript type:

- Type Name - `ResolveResponse`
- Package - `@resolve-js/runtime-base`

:::

The request object exposes the following functions:

| Function                               | Description                                 |
| -------------------------------------- | ------------------------------------------- |
| `status(code)`                         | Specifies the response status code.         |
| `getHeader(key)`                       | Gets a response header by key.              |
| `setHeader(key, value)`                | Sets a response header.                     |
| `text([content] [, encoding])`         | Specifies content for a text-type response. |
| `json([content])`                      | Specifies content for a JSON-type response. |
| `end([content] [, encoding])`          | Ends the response process.                  |
| `file(content, filename [, encoding])` | Specifies a file to send as a response.     |
| `redirect([status,] path)`             | Specifies the redirect path.                |
| `cookie(name, value [, options])`      | Specifies cookies to send to the client.    |
| `clearCookie(name [, options])`        | Clears a cookie from the response.          |
