# **Api Handler Adapters**
This folder contains api handler adapters.

## Usage
```js
// Isomorphic handler
import wrapApiHandler from 'resolve-api-handler-xxx'

async function handler(req, res) {
  /* ... */
}

const apiHandler = wrapApiHandler(handler)
```

```js
// Custom Aws Lambda Handler  
import wrapApiHandler from 'resolve-api-handler-awslambda'

async function getCustomParameters(event, context, callback) {
  return {
    internal: {
      event, 
      context,
      callback
    }
  }
}

async function handler(req, res) {
  console.log(req.internal.event)
  /* ... */
}

const apiHandler = wrapApiHandler(handler, getCustomParameters)
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
  query: Object<key, value>,
  ...customParameters
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

## Available adapters: 
* [resolve-api-handler-express](./resolve-api-handler-express)  
	Used to Express.
* [resolve-api-handler-awslambda](./resolve-api-handler-awslambda)  
	Used to AWS Lambda.

![Analytics](https://ga-beacon.appspot.com/UA-118635726-1/packages-api-handler-adapters-readme?pixel)
