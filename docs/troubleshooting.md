---
id: troubleshooting
title: Troubleshooting
description: This document describes how to solve popular issues with reSolve applications.
---

## An application throws an error when a Read Model is queried.

Reset the Read Model's state as shown below.

### Local application:

```bash
yarn add @resolve-js/module-admin
yarn @resolve-js/module-admin read-models reset <readModelName>
```

### ReSolve Cloud application:

```bash
yarn resolve-cloud read-models reset <deploymentId> <readModelName>
```
