---
id: file-upload
title: File Upload
---

The **@resolve-js/module-uploader** module implements the file upload functionality. You can enable this module as shown below:

##### run.js:

```js
import resolveModuleUploader from '@resolve-js/module-uploader'
const moduleUploader = resolveModuleUploader({ jwtSecret })
...
const baseConfig = merge(
  defaultResolveConfig,
  appConfig,
  moduleAuth,
  moduleUploader
)
```

The **@resolve-js/module-uploader** module adds the following API endpoints to an application:

- `/api/uploader/getFormUpload` - Returns an upload path to use in HTTP forms.
- `/api/uploader/getUploadUrl` - Returns a path used to upload files.
- `/api/uploader/getToken` - Takes user credentials and returns the user's authorization token.

The [personal-data](https://github.com/reimagined/resolve/tree/master/examples/js/personal-data) example application uses the **@resolve-js/module-uploader** module to upload images.
