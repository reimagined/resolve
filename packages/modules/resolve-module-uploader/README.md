# **resolve-module-uploader**
[![npm version](https://badge.fury.io/js/resolve-module-uploader.svg)](https://badge.fury.io/js/resolve-module-uploader)

### Usage

```js
import { merge } from 'resolve-scripts'
import createModuleUploader from 'resolve-module-uploader'

merge(
  resolveConfig,
  createModuleUploader({
     publicDirs: ['dir1', 'dir2'],
     expireTime: 100500,
     jwtSecret: 'jwtSecret'
  })
)
```