---
id: cloud-get-started
title: Getting Started
---

## Register on the ReSolve Cloud Platform

Go to the [admin.resolve.sh](https://admin.resolve.sh) page, click **Sign Up** and follow through the registration process. After registration, you will gain access to your personal admin panel.

## Install the ReSolve CLI

Type the following command to install the reSolve cloud CLI to your application.

```bash
yarn global add resolve-cloud
```

The next step is to use the CLI to authenticate to the reSolve Cloud Platform:

```bash
resolve-cloud login
```

The CLI will ask you for you account credentials and establish an authentication session.

## Create a ReSolve Application

Create a reSolve application. For this tutorial, you can use one of examples that come with the reSolve framework.

```bash
create resolve-app my-app -e shopping-list
```

## Deploy the Application

To deploy your application, type:

```bash
resolve-cloud deploy
```

The CLI will deploy your application on the cloud and print out the deployment's URL. You can open this URL in your browser to view the result.

## View the Result

After the application is deployed, the CLI prints the application's URL on the reSolve Cloud Platform.

```bash
√ "my-app" available at https://z6ze1aqfuedw34qa0gp58xu6ov.resolve.sh
```

Open this URL in a browser to view the result.
