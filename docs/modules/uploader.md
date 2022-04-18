---
id: uploader
title: Uploader
---

The **@resolve-js/module-uploader** module implements the file upload functionality.

## Installation

Use the following console input to install the uploader module:

```sh
yarn add @resolve-js/module-uploader
```

Register the installed module in the project's `run.js` file:

```js title="run.js"
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

| Endpoint                                          | Description                                                   |
| ------------------------------------------------- | ------------------------------------------------------------- |
| [`/api/uploader/getFormUpload`](#get-form-upload) | Gets settings required to submit a file upload form.          |
| [`/api/uploader/getUploadUrl`](#get-upload-url)   | Gets a URL used to send file upload PUT requests.             |
| [`/api/uploader/getToken`](#get-token)            | Get a JSON Web Token used to authorise a file upload request. |

### `/api/uploader/getFormUpload` {#get-form-upload}

Gets settings required to submit a file upload form.

**Query Parameters**

| Parameter Name | Description                                                   |
| -------------- | ------------------------------------------------------------- |
| `dir`          | The name of a public dirrectory where to save uploaded files. |

**Response**

The response contains a JSON object of the following structure:

```js
{
  form,     // (object) An object that contains the upload form settings.
  uploadId, // (string) The unique idetifier of the initiated uploadd process.
}
```

### `/api/uploader/getUploadUrl` {#get-upload-url}

Gets a URL used to send file upload PUT requests.

**Query Parameters**

| Parameter Name | Description                                                   |
| -------------- | ------------------------------------------------------------- |
| `dir`          | The name of a public dirrectory where to save uploaded files. |

**Response**

The response contains a JSON object of the following structure:

```js
{
  uploadUrl, // (string) The target URL for the upload request.
  uploadId,  // (string) The unique idetifier of the initiated uploadd process.
}
```

### `/api/uploader/getToken` {#get-token}

Get a JSON Web Token used to authorise a file upload request.

**Query Parameters**

| Parameter Name | Description                                                   |
| -------------- | ------------------------------------------------------------- |
| `dir`          | The name of a public dirrectory where to save uploaded files. |

**Response**

The response object is a `string` value that is the created JSON Web Token.

## Client API

On the client side you can use the following functions exported by the **@resolve-js/module-uploader** package to communicate with the uploader's [HTTP API endpoints](#http-api):

| Function                          | Description                                                   |
| --------------------------------- | ------------------------------------------------------------- |
| [`getFormUpload`](#getformupload) | Gets settings required to submit a file upload form.          |
| [`getUploadUrl`](#getuploadurl)   | Gets a URL used to send file upload PUT requests.             |
| [`getToken`](#gettoken)           | Get a JSON Web Token used to authorise a file upload request. |

### `getFormUpload`

Gets settings required to submit a file upload form.

### `getUploadUrl`

Gets a URL used to send file upload PUT requests.

### `getToken`

Get a JSON Web Token used to authorise a file upload request.

## Example

The [personal-data](https://github.com/reimagined/resolve/tree/master/examples/js/personal-data) example application uses the **@resolve-js/module-uploader** module to upload images.
