# **@resolve-js/module-uploader**

[![npm version](https://badge.fury.io/js/%40resolve-js%2Fmodule-uploader.svg)](https://badge.fury.io/js/%40resolve-js%2Fmodule-uploader)

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
