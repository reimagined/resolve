## Manage Read Models

The `read-models` command manages the application's read models.

##### View a deployed application's read models:

```
yarn resolve-cloud read-models list 
```

##### Pause and resume read model updates:

```
yarn resolve-cloud read-models pause <readModelName>
```

```
yarn resolve-cloud read-models resume <readModelName>
```

##### Reset a read model's persistent state:

```
yarn resolve-cloud read-models reset <readModelName>
```

## Manage Sagas

The `sagas` command manages the application's sagas.

##### View a list of available sagas:

```
yarn resolve-cloud sagas list 
```

##### Pause and resume a saga:

```
yarn resolve-cloud sagas pause <sagaName>
```

```
yarn resolve-cloud sagas resume <sagaName>
```

##### Reset a saga's persistent state:

```
yarn resolve-cloud sagas reset <sagaName>
```

### Manage Saga Properties

Use the `sagas properties` command to manage a saga's properties.

##### Set a property:

```
yarn resolve-cloud sagas properties set <sagaName> <propertyName> <value>
```

##### Get a property:

```
yarn resolve-cloud sagas properties get <sagaName> <propertyName>
```

##### View all saga's properties:

```
yarn resolve-cloud sagas properties list <sagaName>
```

##### Remove a property:

```
yarn resolve-cloud sagas properties remove <sagaName> <propertyName>
```
