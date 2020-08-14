# **resolve-incremental-import-module**
[![npm version](https://badge.fury.io/js/resolve-module-admin.svg)](https://badge.fury.io/js/resolve-incremental-import-module)
![Analytics](https://ga-beacon.appspot.com/UA-118635726-1/packages-resolve-incremental-import-module-readme?pixel)

## Api-handlers

#### Freeze eventstore
```ts
path: '/api/incremental-import/freeze'
method: 'POST'
arguments: void
```

#### Unfreeze eventstore
```ts
path: '/api/incremental-import/unfreeze'
method: 'POST'
arguments: void
```

#### Inject events to eventstore
```ts
path: '/api/incremental-import/inject-events'
method: 'POST'
arguments: Array<{ 
  aggregateId: string
  type: string
  timestamp: number
  payload: any
}>
```
