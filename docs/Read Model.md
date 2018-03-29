# Read Model

-------------------------------------------------------------------------
Sorry, this article isn't finished yet :(
    
We'll glad to see all your questions:
* [**GitHub Issues**](https://github.com/reimagined/resolve/issues)
* [**Twitter**](https://twitter.com/resolvejs)
* e-mail to **reimagined@devexpress.com**
-------------------------------------------------------------------------

A **read model** provides a system's current state or a part of it in the given format. It is built by processing all events happened in the system. A read model consists of asynchronous projection functions to build some state.

The read model projection function has a storage provider. The storage provider is an abstract facade for read-only operations on a read model state. 

A read model name is used for launching an API facade on the web server at `/api/query/READ_MODEL_NAME`. Each read model should have its own name. If an application consists of only one read model without a name, it will be automatically renamed to `default` and will be available at `/api/query/default`. The launched facade works as a graphql endpoint accepting POST requests in the [appropriate format](http://graphql.org/learn/serving-over-http/#post-request).

A typical read model structure:

```js
export default [
  {
    name: 'Rating',
    projection: {
      Init: async store => {
        await store.defineStorage('Rating', [
          { name: 'id', type: 'string', index: 'primary' },
          { name: 'rating', type: 'number', index: 'secondary' },
          { name: 'name', type: 'string' },
          { name: 'votes', type: 'json' }
        ])
      },
      ItemAppended: async (store, { payload: { id, name } }) => {
        await store.insert('Rating', { id, name, rating: 0, votes: {} })
      }
    },
    resolvers: {
      PagesCount: async (store, args) => {
        const pageLength = Math.max(
          Number.isInteger(args && +args.limit) ? +args.limit : 10,
          0
        )
        const count = await store.count('Rating', {})

        return count > 0 ? Math.floor((count - 1) / pageLength) + 1 : 0
      }
    }
  }
]
```