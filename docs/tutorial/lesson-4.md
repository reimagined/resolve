# Frontend - Display View Model Data in the Browser

In the previous lesson, you modified your application so that it can answer queries. However, at this moment, your application does not provide a [frontent](../basics/frontend.md) that would present this data to an end-user. In this lesson, you will learn how to create a React frontend to display your reSolve application's data.

To keep the example code simple, in this lesson you will only display items of a single shopping list. Later on, you will add support for multiple shopping lists and provide the required means of navigation between lists.

This tutorial sticks to React + Redux as the default choice for building a frontend for a reSolve application. Both React and Redux work well in conjunction with reSolve's infrastructure. ReSolve comes with the client **[resolve-redux](../../packages/core/resolve-redux)** library that provides HOCs allowing you to easily connect your React components to the backend.

Note that, if required, you can use the [standard HTTP API](../basics/curl.md) to communicate with a reSolve backend and implement the frontend using any client-side technology.

### Implement a React Frontend

Create a **ShoppingList.js** file in the client application's containers folder. In this file, implement a component that displays a list of values obtained from the **[data](../basics/frontend.md#obtain-view-model-data)** prop:

**[client/containers/ShoppingList.js:](../../examples/shopping-list-tutorial/lesson-4/client/containers/ShoppingList.js)**

<!-- prettier-ignore-start -->

[embedmd]:# (../../examples/shopping-list-tutorial/lesson-4/client/containers/ShoppingList.js /\/\// /^\}/)
```js
// The example code uses components from the react-bootstrap library to keep the markup compact.
import { ListGroup, ListGroupItem, Checkbox } from 'react-bootstrap'

export class ShoppingList extends React.PureComponent {
  render() {
    const list = this.props.data.list
    return (
      <ListGroup style={{ maxWidth: '500px', margin: 'auto' }}>
        {list.map(todo => (
          <ListGroupItem key={todo.id}>
            <Checkbox inline>{todo.text}</Checkbox>
          </ListGroupItem>
        ))}
      </ListGroup>
    )
  }
}
```

<!-- prettier-ignore-end -->

Now you can use the **resolve-redux** library's **connectViewModel** HOC to bind your component to the **ShoppingList** view model implemented earlier:

**[client/containers/ShoppingList.js:](../../examples/shopping-list-tutorial/lesson-4/client/containers/ShoppingList.js)**

<!-- prettier-ignore-start -->

[embedmd]:# (../../examples/shopping-list-tutorial/lesson-4/client/containers/ShoppingList.js /export const mapStateToOptions/ /export default connectViewModel\(mapStateToOptions\)\(ShoppingList\)/)
```js
export const mapStateToOptions = (state, ownProps) => {
  return {
    viewModelName: 'ShoppingList',
    aggregateIds: ['shopping-list-1']
  }
}

export default connectViewModel(mapStateToOptions)(ShoppingList)
```

<!-- prettier-ignore-end -->

The connectViewModel HOC binds the original component to a reSolve View Model based on options provided by the **mapStateToOptions** function. The **data** prop that you used in your component's implementation is injected by this HOC and contains the View Model's response object. It is the same object that saw when you manually performed a data query using the HTTP API in the lesson 3:

```js
{
  "id": "shopping-list-1",
  "name": "List 1",
  "list": [
    {
      "id": "1",
      "text": "Milk",
      "checked": false
    },
    {
      "id": "2",
      "text": "Eggs",
      "checked": false
    },
    {
      "id": "3",
      "text": "Canned beans",
      "checked": false
    },
    {
      "id": "4",
      "text": "Paper towels",
      "checked": false
    }
  ]
}
```

Place the implemented shopping list within the application's root component:

**[client/containers/App.js:](../../examples/shopping-list-tutorial/lesson-4/client/containers/App.js)**

```js
const App = () => (
  <div>
    ...
    <ShoppingList />
  </div>
)
```

Run your application to see the result:
![result](images/lesson4_result.png)
