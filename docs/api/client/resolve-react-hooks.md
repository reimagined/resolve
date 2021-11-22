---
id: resolve-react-hooks
title: '@resolve-js/react-hooks'
description: The @resolve-js/react-hooks library provides React hooks that you can use to connect React components to a reSolve backend.
---

The **@resolve-js/react-hooks** library provides React hooks that you can use to connect React components to a reSolve backend. The following hooks are provided.

| Hook                                    | Description                                                                    |
| --------------------------------------- | ------------------------------------------------------------------------------ |
| [useClient](#useclient)                 | Returns the [@resolve-js/client](resolve-client.md) library's `client` object. |
| [useCommand](#usecommand)               | Initializes a command that can be passed to the backend.                       |
| [useCommandBuilder](#usecommandbuilder) | Allows a component to generate commands based on input parameters.             |
| [useViewModel](#useviewmodel)           | Establishes a WebSocket connection to a reSolve View Model.                    |
| [useQuery](#usequery)                   | Allows a component to send queries to a reSolve Read Model or View Model.      |
| [useQueryBuilder](#usequerybuilder)     | Allows a component to generate queries based on input parameters.              |
| [useOriginResolver](#useoriginresolver) | Resolves a relative path to an absolute URL within the application.            |
| [useStaticResolver](#usestaticresolver) | Resolves a relative path to a static resource's full URL.                      |

### useClient

Returns the [@resolve-js/client](resolve-client.md) library's `client` object.

#### Example

```js
const client = useClient()

client.command(
  {
    aggregateName: 'Chat',
    type: 'postMessage',
    aggregateId: userName,
    payload: message,
  },
  (err) => {
    if (err) {
      console.warn(`Error while sending command: ${err}`)
    }
  }
)
```

### useCommand

Initializes a command that can be passed to the backend.

#### Example

```js
const ShoppingList = ({
  match: {
    params: { id: aggregateId }
  }
}) => {
  const renameShoppingList = useCommand({
    type: 'renameShoppingList',
    aggregateId,
    aggregateName: 'ShoppingList',
    payload: { name: shoppingList ? shoppingList.name : '' }
  })

  ...

  const onShoppingListNamePressEnter = event => {
    if (event.charCode === 13) {
      event.preventDefault()
      renameShoppingList()
    }
  }

  ...
}
```

### useCommandBuilder

Allows a component to generate commands based on input parameters.

#### Example

```js
const ShoppingList = ({
  match: {
    params: { id: aggregateId }
  }
}) => {
  const clearItemText = () => setItemText('')

  const createShoppingItem = useCommandBuilder(
    text => ({
      type: 'createShoppingItem',
      aggregateId,
      aggregateName: 'ShoppingList',
      payload: {
        text,
        id: Date.now().toString()
      }
    }),
    clearItemText
  )

  ...

  const onItemTextPressEnter = event => {
  if (event.charCode === 13) {
    event.preventDefault()
    createShoppingItem(itemText)
  }

  ...
}
```

### useViewModel

Establishes a WebSocket connection to a reSolve View Model.

#### Example

```js
const ShoppingList = ({
  match: {
    params: { id: aggregateId }
  }
}) => {
  const [shoppingList, setShoppingList] = useState({
    name: '',
    id: null,
    list: []
  })

  const { connect, dispose } = useViewModel(
    'shoppingList',
    [aggregateId],
    setShoppingList
  )

  useEffect(() => {
    connect()
    return () => {
      dispose()
    }
  }, [])

  ...

  const updateShoppingListName = event => {
    setShoppingList({ ...shoppingList, name: event.target.value })
  }

  ...
}
```

### useQuery

Allows a component to send queries to a reSolve Read Model or View Model.

#### Example

```js
const MyLists = () => {
  const getLists = useQuery(
    { name: 'ShoppingLists', resolver: 'all', args: {} },
    (error, result) => {
      setLists(result)
    }
  )

  useEffect(() => {
    getLists()
  }, [])

  ...
}
```

### useQueryBuilder

Allows a component to generate queries based on input parameters.

#### Example

```js
const getPage = useQueryBuilder(
  (page) => ({
    name: 'MessageList',
    resolver: 'paginated',
    args: { page },
  }),
  (error, result) => {
    setMessages(result.data)
  }
)

useEffect(() => {
  getPage(page)
}, [])
```

### useOriginResolver

Resolves a relative path to an absolute URL within the application.

#### Example

```js
var resolver = useOriginResolver()
var commandApiPath = resolver('/api/commands')
```

### useStaticResolver

Resolves a relative path to a static resource's full URL.

```js
var staticResolver = useStaticResolver()
var imagePath = staticResolver('/account/image.jpg')
```
