---
id: resolve-context
title: ReSolve Context
---

The `resolve` context object is available to an [API handler](api-handler.md) function through the [request (`req`)](api-handler.md#request) object. This object implements a communication layer between an API handler and the reSolve framework.

The `resolve` context object exposes the following API:

## Objects

| Field Name          | Description |
| ------------------- | ----------- |
| `uploader`          |             |
| `eventstoreAdapter` |             |
| `performanceTracer` |             |
| `monitoring`        |             |

## Methods

| Function Name    | Description |
| ---------------- | ----------- |
| `executeCommand` |             |
| `executeQuery`   |             |
| `executeSaga`    |             |

## Constants

| Constant Name     | Description |
| ----------------- | ----------- |
| `applicationName` |             |
| `distDir`         |             |
| `jwtCookie`       |             |
| `rootPath`        |             |
| `staticDir`       |             |
| `staticPath`      |             |
| `staticRoutes?`   |             |
