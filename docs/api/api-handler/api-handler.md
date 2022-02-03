---
id: api-handler
title: API Handler
description: This article describes the structure of an API handler function and its arguments.
---

An API handler function has the following structure:

```js
export default async (req, res) => {
  // ...
}
```

The handler receives a request and response objects. See the sections below for the information on the API exposed through these objects.

### Request

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

The request object exposes the following functions:

| Function                               | Description                                 |
| -------------------------------------- | ------------------------------------------- |
| `status(code)`                         | Specifiers the response status code.        |
| `getHeader(key)`                       | Get a response header by key.               |
| `setHeader(key, value)`                | Sets a response header.                     |
| `text([content] [, encoding])`         | Specifies content for a text-type response  |
| `json([content])`                      | Specifies content for a JSON-type response. |
| `end([content] [, encoding])`          | Ends the response process.                  |
| `file(content, filename [, encoding])` | Specifies a file to write to response.      |
| `redirect([status,] path)`             | Specifies the redirect path.                |
| `cookie(name, value [, options])`      | Specifies cookies to send to the client.    |
| `clearCookie(name [, options])`        | Clears a cookie from the response.          |
