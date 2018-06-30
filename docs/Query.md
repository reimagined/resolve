# Query

## What is a Query?

A **Query** is a function used to fetch data from a Read Model or View Model.

Refer to the [Edument CQRS Starter Kit Tutorial](http://cqrs.nu/tutorial/cs/01-design) for details.

## How to Use?

**Read Model Queries** are defined in the *commmon/read-models/resolvers.js* file:

```
📁 resolve-app
    ...
    📁 common
        📁 read-models
            📄 resolvers.js
```

A sample Query:

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

📑 Available scripts, project structure overview, configuration files, and more useful information can be found in the [**API References**](https://github.com/reimagined/resolve/blob/master/docs/API%20References.md) topic.

📑 Refer to the [**Architecture**](https://github.com/reimagined/resolve/blob/master/docs/Architecture.md) documentation topic to learn more about common architecture building principles.

📑 You can learn how to create simple applications with reSolve in the [**Tutorials**](https://github.com/reimagined/resolve/tree/master/docs/Tutorials) section.

![Analytics](https://ga-beacon.appspot.com/UA-118635726-1/docs-query?pixel)