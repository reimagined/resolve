# **Api Handler Adapters**
This folder contains api handler adapters.

## Usage
```js
import wrapApiHandler from 'resolve-api-handler-xxx'

const apiHandler = wrapApiHandler(handler, customParameters)
```

## Request
```js
{
  method: "GET" | "HEAD" | "POST" | "PUT" | "DELETE" | "CONNECT" | "OPTIONS" | "TRACE" | "PATCH",
  originalUrl: String,
  protocol: String,
  host: String,
  path: String,
  body: String,
  cookies: Object<key, value>,
  headers: Object<key, value>,
  query: Object<key, value>,
  ...customParameters
}
```

## Response
```js
{
  status(code)
  getHeader(key)
  setHeader(key, value)
  text([content] [, encoding])
  json([content])
  end([content] [, encoding])
  file(content, filename [, encoding])
  redirect([status,] path)
  cookie(name, value [, options])
  clearCookie(name [, options])
}
```

## Available adapters: 
* [resolve-api-handler-express](./resolve-api-handler-express)  
	Used to Express.
* [resolve-api-handler-lambda](./resolve-api-handler-lambda)  
	Used to AWS Lambda.

![Analytics](https://ga-beacon.appspot.com/UA-118635726-1/packages-api-handler-adapters-readme?pixel)
