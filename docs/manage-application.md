---
id: manage-aplication
title: Manage a ReSolve Application
---

Use the [resolve-module-admin](https://github.com/reimagined/resolve/tree/master/packages/modules/resolve-module-admin#readme) utility to manage a reSolve application's sagas and read models. You can use **npx** to run this utility without installation or install it s an application's dependency as the following section describes.

## Installation

1. Install the [resolve-module-admin](https://github.com/reimagined/resolve/tree/master/packages/modules/resolve-module-admin#readme) package:

   ```bash
   yarn add resolve-module-admin
   ```

2. Register a script that runs the **resolve-module-admin** utility in the application's **package.json** file:

   ```js
   "scripts": {
     ...
     "resolve-module-admin": "resolve-module-admin",
     ...
   }
   ```

## Usage
