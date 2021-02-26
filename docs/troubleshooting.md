---
id: troubleshooting
title: Troubleshooting
---

## An application throws an error when a Read Model is queried.

Reset the Read Model's state as shown below.

#### Local application:

```bash
yarn add @reimagined/module-admin
yarn @reimagined/module-admin read-models reset <readModelName>
```

#### ReSolve Cloud application:

```bash
yarn resolve-cloud read-models reset <deploymentId> <readModelName>
```
