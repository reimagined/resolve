---
id: resolve-context
title: ReSolve Context
---

The `resolve` context object is available to an API handler through the request (`req`) object. This object exposes the following API.

**Objects:**

| Field Name          | Description |
| ------------------- | ----------- |
| `uploader`          |             |
| `eventstoreAdapter` |             |
| `performanceTracer` |             |


**Methods:**

| Function Name    | Description |
| ---------------- | ----------- |
| `executeCommand` |             |
| `executeQuery`   |             |
| `executeSaga`    |             |
| `seedClientEnvs` |             |
| `broadcastEvent` |             |

**Constants:**

| Constant Name     | Description |
| ----------------- | ----------- |
| `applicationName` |             |
| `distDir`         |             |
| `jwtCookie`       |             |
| `rootPath`        |             |
| `staticDir`       |             |
| `staticPath`      |             |
| `staticRoutes?`   |             |
