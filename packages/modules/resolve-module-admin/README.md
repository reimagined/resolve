## Manage Read Models

The `read-models` command manages the application's read models.

##### View a deployed application's read models:

```
yarn resolve-cloud read-models list <deploymentId>
```

##### Pause and resume read model updates:

```
yarn resolve-cloud read-models pause <deploymentId> <readModelName>
```

```
yarn resolve-cloud read-models resume <deploymentId> <readModelName>
```

##### Reset a read model's persistent state:

```
yarn resolve-cloud read-models reset <deploymentId> <readModelName>
```

## Manage Sagas

The `sagas` command manages the application's sagas.

##### View a list of available sagas:

```
yarn resolve-cloud sagas list <deploymentId>
```

##### Pause and resume a saga:

```
yarn resolve-cloud sagas pause <deploymentId> <sagaName>
```

```
yarn resolve-cloud sagas resume <deploymentId> <sagaName>
```

##### Reset a saga's persistent state:

```
yarn resolve-cloud sagas reset <deploymentId> <sagaName>
```

### Manage Saga Properties

Use the `sagas properties` command to manage a saga's properties.

##### Set a property:

```
yarn resolve-cloud sagas properties set <deploymentId> <sagaName> <propertyName> <value>
```

##### View all saga's properties:

```
yarn resolve-cloud sagas properties list <deploymentId> <sagaName>
```

##### Remove a property:

```
yarn resolve-cloud sagas properties remove <deploymentId> <sagaName> <propertyName>
```
