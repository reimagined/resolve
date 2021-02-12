# **resolve-module-uploader**
[![npm version](https://badge.fury.io/js/resolve-module-uploader.svg)](https://badge.fury.io/js/resolve-module-uploader)

### Usage

```js
import { merge } from '@reimagined/scripts'
import createModuleUploader from '@reimagined/module-uploader'

merge(
  resolveConfig,
  createModuleUploader({
     jwtSecret: 'jwtSecret'
  })
)
```
