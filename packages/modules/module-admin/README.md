# **@resolve-js/module-admin**
[![npm version](https://badge.fury.io/js/@resolve-js/module-admin.svg)](https://badge.fury.io/js/@resolve-js/module-admin)
![Analytics](https://ga-beacon.appspot.com/UA-118635726-1/packages-@resolve-js/module-admin-readme?pixel)

## Manage Read Models

The `read-models` command manages the application's read models.

##### View a deployed application's read models:

```
npx @resolve-js/module-admin read-models list 
```

##### Pause and resume read model updates:

```
npx @resolve-js/module-admin read-models pause <readModelName>
```

```
npx @resolve-js/module-admin read-models resume <readModelName>
```

##### Reset a read model's persistent state:

```
npx @resolve-js/module-admin read-models reset <readModelName>
```

## Manage Sagas

The `sagas` command manages the application's sagas.

##### View a list of available sagas:

```
npx @resolve-js/module-admin sagas list 
```

##### Pause and resume a saga:

```
npx @resolve-js/module-admin sagas pause <sagaName>
```

```
npx @resolve-js/module-admin sagas resume <sagaName>
```

##### Reset a saga's persistent state:

```
npx @resolve-js/module-admin sagas reset <sagaName> [--side-effects-start-timestamp YYYY-MM-DDTHH:mm:ss.sssZ]
```

### Manage Saga Properties

Use the `sagas properties` command to manage a saga's properties.

##### Set a property:

```
npx @resolve-js/module-admin sagas properties set <sagaName> <propertyName> <value>
```

##### Get a property:

```
npx @resolve-js/module-admin sagas properties get <sagaName> <propertyName>
```

##### View all saga's properties:

```
npx @resolve-js/module-admin sagas properties list <sagaName>
```

##### Remove a property:

```
npx @resolve-js/module-admin sagas properties remove <sagaName> <propertyName>
```

## FAQ

### How to restart saga side effects with custom time

```
npx @resolve-js/module-admin sagas reset <sagaName> --side-effects-start-timestamp YYYY-MM-DDTHH:mm:ss.sssZ
npx @resolve-js/module-admin sagas resume <sagaName>
```
