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


## Read model custom connector API example

[mdis]:# (./custom-readmodel-sample/connector.js)
```js
export default (options) => {
  const prefix = String(options.prefix)
  const readModels = new Set()
  const connect = async (readModelName) => {
  	fs.writeFileSync(`${prefix}${readModelName}.lock`, true, { flag: 'wx' })
  	readModels.add(readModelName)
  	const store = {
      get(){
        return JSON.parse(String(fs.readFileSync(`${prefix}${readModelName}`)))
      },
      set(value) {
        fs.writeFileSync(`${prefix}${readModelName}`, JSON.stringify(value))
      }
    }
    return store
  }
  const disconnect = async (store, readModelName) => {
  	fs.unlinkSync(`${prefix}${readModelName}.lock`)
  	readModels.delete(readModelName)
  }
  const drop = async (store, readModelName) => {
  	fs.unlinkSync(`${prefix}${readModelName}.lock`)
  	fs.unlinkSync(`${prefix}${readModelName}`)
  }
  const dispose = async () => {
	 for(const readModelName of readModels) {
     fs.unlinkSync(`${prefix}${readModelName}.lock`)
	 }
	 readModels.clear()
  }
  return {
  	connect,
  	disconnect,
  	drop,
  	dispose
  }
}
```


![Analytics](https://ga-beacon.appspot.com/UA-118635726-1/tests-readme?pixel)
