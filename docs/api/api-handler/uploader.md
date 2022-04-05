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

The [Uploader module](../modules/uploader.md) implements handlers based on this API as well as client-side wrapper functions that you can use to communicate with these handlers. Consider using this module if your application does not need any custom file upload handling logic.

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

| Argument Name | Type   | Description |
| ------------- | ------ | ----------- |
| dir           | string |             |

**Result**

`Promise<{ uploadUrl: string; uploadId: string }>`

## `getSignedPost`

Get a URL used to upload files through `POST` requests.

**Example**

**Arguments**

| Argument Name | Type   | Description |
| ------------- | ------ | ----------- |
| dir           | string |             |

**Result**

`Promise<{ form: any; uploadId: string }>`

## `uploadPut`

Send a `PUT` request to upload a file from server code.

**Example**

**Arguments**

| Argument Name | Type   | Description |
| ------------- | ------ | ----------- |
| uploadUrl     | string |             |
| filePath      | string |             |

**Result**

`Promise<void>`

## `uploadPost`

Send a `POST` request to upload a file from server code.

**Example**

**Arguments**

| Argument Name           | Type     | Description |
| ----------------------- | -------- | ----------- |
| `form: { url: string }` | `object` |             |
|                         |          |             |

**Result**

`Promise<void>`

## `createToken`

Create a JSON Web Token used to authorize the upload operation.

**Example**

**Arguments**

| Argument Name                                  | Type     | Description |
| ---------------------------------------------- | -------- | ----------- |
| `options: { dir: string; expireTime: number }` | `object` |             |

**Result**

`string`
