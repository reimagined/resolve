# **@resolve-js/runtime-aws-serverless**

[![npm version](https://badge.fury.io/js/%40resolve-js%2Fruntime.svg)](https://badge.fury.io/js/%40resolve-js%2Fruntime-aws-serverless)

This package contains a runtime backend server that targets the AWS serverless environment.

## Available Options

You can specify the following option to configure the runtime:

- `importMode`- Specifies whether to use static or dynamic imports between the application's modules.

## Usage

```js
// config.cloud.js
const prodConfig = {
  runtime: {
    module: '@resolve-js/runtime-aws-serverless',
    options: { importMode: 'dynamic' },
  },
  ...
}
```

![Analytics](https://ga-beacon.appspot.com/UA-118635726-1/packages-resolve-runtime-aws-serverless-readme?pixel)
