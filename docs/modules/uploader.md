---
id: uploader
title: Uploader
---

The **@resolve-js/module-uploader** module implements the file upload functionality. You can enable this module as shown below:

**run.js:**

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

## HTTP API

The **@resolve-js/module-uploader** module adds the following API endpoints to an application:

- `/api/uploader/getFormUpload` - Gets settings required to submit a file upload form.
- `/api/uploader/getUploadUrl` - Gets a URL used to send file upload PUT requests.
- `/api/uploader/getToken` - Get a JSON Web Token used to authorise a file upload request.

## Client API

On the client side you can use the following functions exported by the **@resolve-js/module-uploader** to communicate with the uploader's [HTTP API endpoints](#http-api):

- `getFormUpload` - Gets settings required to submit a file upload form.
- `getUploadUrl`- Gets a URL used to send file upload PUT requests.
- `getToken` - Get a JSON Web Token used to authorise a file upload request.

## Example

The [personal-data](https://github.com/reimagined/resolve/tree/master/examples/js/personal-data) example application uses the **@resolve-js/module-uploader** module to upload images.
