# **@resolve-js/module-uploader**

[![npm version](https://badge.fury.io/js/@resolve-js/module-uploader.svg)](https://badge.fury.io/js/@resolve-js/module-uploader)

### Usage

```js
import { merge } from '@resolve-js/scripts'
import createModuleUploader from '@resolve-js/module-uploader'

merge(
  resolveConfig,
  createModuleUploader({
    jwtSecret: 'jwtSecret',
  })
)
```
