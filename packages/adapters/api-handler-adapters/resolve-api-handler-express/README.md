# **resolve-api-handler-express**
[![npm version](https://badge.fury.io/js/resolve-api-handler-express.svg)](https://badge.fury.io/js/resolve-api-handler-express)

This package is a [Api Handler](../README.md) adapter for [Express](https://github.com/expressjs/express). 

## Usage

```js
import express from 'express'
import wrapApiHandler from 'resolve-api-handler-express'

const handler = async (req, res) => {
  res.end('Hello World!')
}

const app = express()

app.use('/my-handler', wrapApiHandler(handler))

app.listen(3000)
```

![Analytics](https://ga-beacon.appspot.com/UA-118635726-1/packages-resolve-api-handler-express-readme?pixel)
