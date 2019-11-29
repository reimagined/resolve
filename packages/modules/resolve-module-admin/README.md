## Manage Read Models

The `read-models` command manages the application's read models.

##### View a deployed application's read models:

```
npx resolve-module-admin read-models list 
```

##### Pause and resume read model updates:

```
npx resolve-module-admin read-models pause <readModelName>
```

```
npx resolve-module-admin read-models resume <readModelName>
```

##### Reset a read model's persistent state:

```
npx resolve-module-admin read-models reset <readModelName>
```

## Manage Sagas

The `sagas` command manages the application's sagas.

##### View a list of available sagas:

```
npx resolve-module-admin sagas list 
```

##### Pause and resume a saga:

```
npx resolve-module-admin sagas pause <sagaName>
```

```
npx resolve-module-admin sagas resume <sagaName>
```

##### Reset a saga's persistent state:

```
npx resolve-module-admin sagas reset <sagaName>
```

### Manage Saga Properties

Use the `sagas properties` command to manage a saga's properties.

##### Set a property:

```
npx resolve-module-admin sagas properties set <sagaName> <propertyName> <value>
```

##### Get a property:

```
npx resolve-module-admin sagas properties get <sagaName> <propertyName>
```

##### View all saga's properties:

```
npx resolve-module-admin sagas properties list <sagaName>
```

##### Remove a property:

```
npx resolve-module-admin sagas properties remove <sagaName> <propertyName>
```
