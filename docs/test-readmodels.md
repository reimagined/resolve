---
id: test-readmodels
title: Test Read Models
---

The **resolve-testing-tools** package contains utilities that allow you to test Read Models and Sagas. The provided tools reproduce a Read Model's full lifecycle in the testing environment.

The code sample below demonstrates a Read Model testing code used in a **jest** test:

```js
test('projection "SHOPPING_LIST_CREATED" should create a shopping list', async () => {
  const shoppingLists = await givenEvents([
    {
      aggregateId,
      type: SHOPPING_LIST_CREATED,
      payload: {
        name: 'Products'
      }
    }
  ])
    .readModel({
      name: 'ShoppingLists',
      projection,
      resolvers,
      adapter
    })
    .all()

  expect(shoppingLists[0]).toMatchObject({
    id: aggregateId,
    name: 'Products'
  })
})
```

For the full code, see the **shopping-list** example application's **test/unit/readmodel.test.js** file.

To write a test, call the `givenEvents` function. This function takes an array of events and gives access to a number of functions that you can chain together to describe the test case. The following functions are available:

| Function | Description |
|-- | --- |
| `readModel({ name, projection, resolvers, adapter })` | Runs a Read Model projection on the given events and provides access to the Read Model's resolver functions. |
| `as(jwtToken)` | Specifies a JWT used for authentication. |
| `saga({ handlers, sideEffects, adapter, name })` | Runs a Saga on the given events. |
| `properties(sagaProperties)` | Specifies Saga properties |