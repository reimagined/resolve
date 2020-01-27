---
id: cloud-troubleshooting
title: Troubleshooting
---

## An application does not output any logs.

Make sure that you run your application with the correct debug levels.

Refer to the [debugging](debugging.md) topic for more information.

## An application works correctly on the local machine but does not run on the cloud.

Check the application's **config.cloud.js** configuration file. If your application does not run on the cloud, the most likely reason is that you forgot to update this file after you changed the application's structure or updated the application to a new version of the reSolve framework.

## How to view deployment errors?

Use the `describe` command of the [reSolve Cloud CLI](cloud-cli.md). Among other information, this command outputs the last error occurred during the application's deployment.

```bash
resolve-cloud describe <deploymentId>
```
