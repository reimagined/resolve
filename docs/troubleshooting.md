---
id: troubleshooting
title: Troubleshooting
---

## An application throws an error when a Read Model is queried.

Reset the Read Model's consistent state.

#### Local application:

```bash
yarn add resolve-module-admin
yarn resolve-module-admin read-models reset <readModelName>
```

#### ReSolve Cloud application:

```bash
yarn resolve-cloud read-models reset <deploymentId> <readModelName>
```