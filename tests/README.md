# **Tests**

This directory contains API and integration tests for the reSolve framework.

## Read model store API example

[mdis]:# (./read-models-sample/projection.js#read-store-api)
```js
await store.defineTable('TestTable', {
  indexes: {
    firstIndexName: 'number',
    secondIndexName: 'string'
  },
  fields: [
    'firstFieldName',
    'secondFieldName',
    'firstJsonName',
    'secondJsonName'
  ]
})
...
await store.insert('TestTable', {
  firstIndexName: 1,
  secondIndexName: 'idx-a',
  firstFieldName: testEventContent,
  secondFieldName: 0,
  firstJsonName: { a: 1, b: 2, e: 10 },
  secondJsonName: [1, 2, 3]
})
...
await store.update(
  'TestTable',
  {
    firstIndexName: { $gt: 1 },
    secondIndexName: 'idx-a'
  },
  {
    $set: {
      'firstJsonName.f': 'inner-field',
      firstFieldName: 'outer-field',
      secondJsonName: ['outer', 'json', 'value', testEventContent]
    },
    $unset: {
      'firstJsonName.d': true
    },
    $inc: {
      'firstJsonName.e': 5,
      secondFieldName: 42
    }
  }
)
...
await store.update(
  'TestTable',
  { firstIndexName: 10 },
  {
    $set: {
      'firstJsonName.f': 'inner-field',
      firstFieldName: 'outer-field',
      secondJsonName: ['outer', 'json', 'value', testEventContent]
    }
  },
  { upsert: true }
)
...
await store.delete('TestTable', {
  firstIndexName: { $gt: 1 },
  secondIndexName: 'idx-a'
})
```

![Analytics](https://ga-beacon.appspot.com/UA-118635726-1/tests-readme?pixel)
