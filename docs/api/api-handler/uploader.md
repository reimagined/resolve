---
id: uploader
title: Uploader
---

Uploader API is available to an [API Handler](api-handler/api-handler.md) through the [reSolve context](api-handler/resolve-context.md) object.

```js
const myHandler = async (req, res) => {
  const { uploader } = req.resolve
  ...
}
```

Use this API to implement custom file upload functionality.

:::tip

The [Uploader module](../modules/uploader.md) implements handlers based on this API as well as client-side wrapper functions that you can use to communicate with these handlers. Consider using this module if your application does not need any custom logic to handle file uploads.

:::

An uploader object exposes the following API:

| Function Name                     | Description                                                     |
| --------------------------------- | --------------------------------------------------------------- |
| [`getSignedPut`](#getsignedput)   | Get a URL used to upload files through `PUT` requests.          |
| [`getSignedPost`](#getsignedpost) | Get a URL used to upload files through `POST` requests.         |
| [`uploadPut`](#uploadput)         | Send a `PUT` request to upload a file from server code.         |
| [`uploadPost`](#uploadpost)       | Send a `POST` request to upload a file from server code.        |
| [`createToken`](#createtoken)     | Create a JSON Web Token used to authorize the upload operation. |

## `getSignedPut`

Get a URL used to upload files through `PUT` requests.

**Example**

**Arguments**

| Argument Name | Type     | Description                                                |
| ------------- | -------- | ---------------------------------------------------------- |
| `dir`         | `string` | The name of a dirrectory where to store the uploaded file. |

**Result**

A promise that resolve to an object of the following structure:

```js
{
  uploadUrl, // (string) The target URL for the upload request.
  uploadId,  // (string) The unique idetifier of the initiated uploadd process.
}
```

## `getSignedPost`

Get a URL used to upload files through `POST` requests.

**Example**

**Arguments**

| Argument Name | Type     | Description                                                |
| ------------- | -------- | ---------------------------------------------------------- |
| `dir`         | `string` | The name of a dirrectory where to store the uploaded file. |

**Result**

A promise that resolve to an object of the following structure:

```js
{
  form,     // (object) An object that contains the upload form settings.
  uploadId, // (string) The unique idetifier of the initiated uploadd process.
}
```

## `uploadPut`

Send a `PUT` request to upload a file from server code.

**Example**

**Arguments**

| Argument Name | Type     | Description                            |
| ------------- | -------- | -------------------------------------- |
| `uploadUrl`   | `string` | The target URL for the upload request. |
| `filePath`    | `string` | The path to the uploaded file.         |

**Result**

A promise that resolves when the upload succeeds.

## `uploadPost`

Send a `POST` request to upload a file from server code.

**Example**

**Arguments**

| Argument Name           | Type     | Description                    |
| ----------------------- | -------- | ------------------------------ |
| `form: { url: string }` | `object` | The file upload form settings. |
| `filePath`              | `string` | The path to the uploaded file. |

**Result**

A promise that resolves when the upload succeeds.

## `createToken`

Create a JSON Web Token used to authorize the upload operation.

**Example**

**Arguments**

| Argument Name                                  | Type     | Description                                      |
| ---------------------------------------------- | -------- | ------------------------------------------------ |
| `options: { dir: string; expireTime: number }` | `object` | Tbe options used to configure the created token. |

**Result**

A `string` value that is the created JSON Web Token.
