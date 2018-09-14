# **resolve-api-handler-awslambda**
[![npm version](https://badge.fury.io/js/resolve-api-handler-awslambda.svg)](https://badge.fury.io/js/resolve-api-handler-awslambda)

This package is a [Api Handler](../README.md) adapter for [AWS Lambda](https://github.com/expressjs/express). 

## Usage

```js
import wrapApiHandler from 'resolve-api-handler-awslambda'

export const handler = wrapApiHandler(
  async (req, res) => {
    res.end('Hello World!')
  }
)
```

![Analytics](https://ga-beacon.appspot.com/UA-118635726-1/packages-resolve-api-handler-awslambda-readme?pixel)
