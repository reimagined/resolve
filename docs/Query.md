# Query

## What is a Query?

**Query** are used to get data from a Read Model and View Model. 

Refer to [DDD, Event Sourcing, and CQRS Tutorial: design](http://cqrs.nu/tutorial/cs/01-design) for more information on queries.

## How to Use?

You can describe Queries for Read Model in commmon/read-models/resolvers.js file:

```
📁 resolve-app
    ...
    📁 common
        📁 read-models
            📄 resolvers.js
```

A typical Query structure:

```js
export default {
  user: async (store, { id, name }) => {
    const user =
      name != null
        ? await store.findOne('Users', { name })
        : id != null
          ? await store.findOne('Users', { id })
          : null

    return user
  }
}
```

## What's Next?

📑 Available scripts, project structure overview, configuration files and much other useful information are in [**API References**](https://github.com/reimagined/resolve/blob/master/docs/API%20References.md) topic.

📑 To learn more about common building principles of architecture, please look at [**Architecture**](https://github.com/reimagined/resolve/blob/master/docs/Architecture.md) documentation topic.

📑 In [**Tutorials**](https://github.com/reimagined/resolve/tree/master/docs/Tutorials) you can find how to make some simple applications with reSolve.

![Analytics](https://ga-beacon.appspot.com/UA-118635726-1/docs-query?pixel)