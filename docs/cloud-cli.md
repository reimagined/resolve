---
id: cloud-cli
title: reSolve Cloud CLI
---

The reSolve Cloud CLI is a console tool that allows you to deploy an application to the cloud and manage all aspects of the deployed application's functionality.

## Install ReSolve CLoud CLI

ReSolve Cloud CLI is [available on NPM](https://www.npmjs.com/package/resolve-cloud). You can install it as shown bellow:

```bash
yarn global add resolve-cloud
```

## Usage

Use the following console inputs to login to the reSolve Cloud Platform and deploy an application:

```bash
yarn create resolve-app resolve-app
cd resolve-app
<develop your app locally>
resolve-cloud login
resolve-cloud deploy
```

The platform assigns a unique ID to an application's deployment. You can use this ID to view information about the deployment or manage the deployment's settings:

```bash
resolve-cloud describe <deploymentId>
resolve-cloud logs get <deploymentId>
resolve-cloud read-models list <deploymentId>
resolve-cloud remove <deploymentId>
```

## View Help

Use the `--help` option to view embedded help on the CLI or one of its commands:

```bash
resolve-cloud --help
```

```bash
resolve-cloud deploy --help
```
