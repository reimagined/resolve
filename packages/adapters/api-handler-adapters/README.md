# **Api Handler Adapters** 🚌
This folder contains [resolve-es](../../core/resolve-es) bus adapters.

Request
```js
req.body
req.cookies
req.method
req.params
req.path
req.query
req.headers
``

Response
```js
res.cookie(name, value [, options])
res.clearCookie(name [, options])

res.file(bufferOrString, filename)

res.end([bufferOrString] [, encoding])
res.text([string])
res.json([body])

res.redirect([status,] path)

res.status(code)

res.getHeader(field)
res.setHeader(field [, value])
```


Available adapters: 
* [resolve-api-handler-express](./resolve-api-handler-express)  
	Used to emit and listen events using memory.
* [resolve-api-handler-lambda](./resolve-api-handler-lambda)  
	Used to emit and listen events using RabbitMQ.

![Analytics](https://ga-beacon.appspot.com/UA-118635726-1/packages-api-handler-adapters-readme?pixel)
