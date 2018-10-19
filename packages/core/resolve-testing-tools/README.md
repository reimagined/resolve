# **resolve-testing-tools**
[![npm version](https://badge.fury.io/js/resolve-testing-tools.svg)](https://badge.fury.io/js/resolve-testing-tools)

This package for testing read-model, view-model, aggregate, saga, API handler, bus, storage and event-store.

### Read Model
```js
import { createReadModel } from 'resolve-testing-tools'

import projection from './common/read-models/something.projection'
import resolvers from './common/read-models/something.resolvers'

describe('read-model "something"', () => {
  let readModel
  
  beforeEach(() => {
    readModel = createReadModel({
      name: 'something', 
      projection, 
      resolvers, 
      /* adapter */ // custom adapter 
    }) 
  })

  afterEach(async () => {
    await readModel.dispose()
  })

  test('resolver "myCustomResolverName" should return correctly result', async () => {   
    await readModel.applyEvent(event)
    await readModel.applyEvents(events)
    
    const result = await readModel.resolvers.myCustomResolverName(resolverArgs, jwtToken)
  
    expect(result).toMatchSnapshot()
  })
})
```

![Analytics](https://ga-beacon.appspot.com/UA-118635726-1/packages-resolve-testing-tools-readme?pixel)
