---
id: resolve-context
title: ReSolve Context
---

The `resolve` context object is available to an [API handler](api-handler.md) function through the [request (`req`)](api-handler.md#request) object. This object implements a communication layer between an API handler and the reSolve framework.

The `resolve` context object exposes the following API:

## Objects

| Field Name          | Description                                                       |
| ------------------- | ----------------------------------------------------------------- |
| `uploader`          | Exposes the file upload API.                                      |
| `eventstoreAdapter` | Exposes the [event store adapter API](../event-store-adapter.md). |
| `performanceTracer` | Exposes the performance tracer API.                               |
| `monitoring`        | Exposes the monitoring API.                                       |

## Methods

| Function Name    | Description           |
| ---------------- | --------------------- |
| `executeCommand` | Emits a command.      |
| `executeQuery`   | Queries a read model. |
| `executeSaga`    |                       |

## Constants

| Constant Name     | Type                 | Description                                                                                                                                                                      |
| ----------------- | -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `applicationName` | `string`             | The reSolve application's name as specified in `package.json`.                                                                                                                   |
| `distDir`         | `string`             | The path to the WebPack `dist` directory within the application.                                                                                                                 |
| `jwtCookie`       | `object`             | An object that contain [JWT cookie settings](../../application-configuration.md#jwtcookie)) as specified in the [application configuration](../../application-configuration.md). |
| `rootPath`        | `string`             | The application's root URL path.                                                                                                                                                 |
| `staticDir`       | `string`             | The path to a directory that contains static files.                                                                                                                              |
| `staticPath`      | `string`             | The base URL path for static file URLs.                                                                                                                                          |
| `staticRoutes?`   | `string[]` or `null` |                                                                                                                                                                                  |
