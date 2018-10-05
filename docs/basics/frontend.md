# React/Redux Support
The reSolve framework is shipped with the client **resolve-redux** library that allows you to easily connect you client React + Redux app to a reSolve-powered backend. 

The **redux** config section specifies the following settings related to the Redux-based frontend:

* **store** - Specifies the file containing the Redux store definition.
* **reducers** - Specifies the file containing the Redux reducer definition.
* **middlewares** - Specifies the file containing the Redux middleware definitions.

Based on the specified setting, reSolve injects client code to facilitate client-server communication:
* Redux actions are generated for available reSolve aggregate commands. 
* Auxiliary reducer and middleware code are generated to handle these actions and send the corresponding commands to the server. 

To connect components to the backend, use the following resolve-redux library's higher order components (HOCs):

* **connectReadModel** - Connects a component to Read Model.
* **connectViewModel** - Connects a component to a View Model.

A connected component obtains additional props providing access to the Read Model data and available Redux actions mapped to reSolve commands. You can chain the connectReadModel function call with the Redux **connect** function call:


[embedmd]:# (..\..\examples\shopping-list\client\containers\MyLists.js /export const mapStateToOptions/ /^\)/)
```js
export const mapStateToOptions = () => ({
  readModelName: 'ShoppingLists',
  resolverName: 'all',
  resolverArgs: {}
})

export const mapStateToProps = state => ({
  lists: state.optimisticShoppingLists || []
})

export const mapDispatchToProps = (dispatch, { aggregateActions }) =>
  bindActionCreators(aggregateActions, dispatch)

export default connectReadModel(mapStateToOptions)(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(MyLists)
)
```

Additionally, the following HOCs automatically fix URLs passed as component props so that these URLs comply with the backend structure.

* **connectRootBasedUrls** - Fixes server routs.
  ```js
  export default connectRootBasedUrls(['href'])(Link)  
  ```


* **connectStaticBasedUrls** - Fixes static files paths.
  ```js
  export default connectStaticBasedUrls(['css', 'favicon'])(Header)
  ```






# Sending Commands as Redux Actions
A component connected to a Read Model receives an object containing available command names. You can use the **redux.bindActionCreators** function to automatically wrap all these commands into **dispatch** function calls. This allows for a compact implementation of the **mapDispatchToProps** function: 

[embedmd]:# (..\..\examples\shopping-list\client\containers\MyLists.js /export const mapDispatchToProps/ /bindActionCreators\(aggregateActions, dispatch\)/)
```js
export const mapDispatchToProps = (dispatch, { aggregateActions }) =>
  bindActionCreators(aggregateActions, dispatch)
```

After this, you can use dispatch aggregate commands using the corresponding props:

[embedmd]:# (..\..\examples\shopping-list\client\containers\MyLists.js /class MyLists/ /^\}/)
```js
class MyLists extends React.PureComponent {
  render() {
    const { lists, createShoppingList, removeShoppingList } = this.props

    return (
      <div className="example-wrapper">
        <ShoppingLists lists={lists} removeShoppingList={removeShoppingList} />
        <ShoppingListCreator
          lists={lists}
          createShoppingList={createShoppingList}
        />
      </div>
    )
  }
}
```




# Reactive View Models, Event Subscription
A View Model is a special kind of a Read Mode. A View Model's projection is declared in a universal format so it can also serve as the reducer code on the client side. Because of this property, View Models are reactive out of the box. This means that a component connected to a View Model using the **connectViewModel** method automatically reflect the Read Model changes on the server side, without the need to implement any additional logic. 

[embedmd]:# (..\..\examples\shopping-list\client\containers\ShoppingList.js /export const mapStateToOptions/ /^\)/)
```js
export const mapStateToOptions = (state, ownProps) => {
  const aggregateId = ownProps.match.params.id

  return {
    viewModelName: 'ShoppingList',
    aggregateIds: [aggregateId]
  }
}

export const mapStateToProps = (state, ownProps) => {
  const aggregateId = ownProps.match.params.id

  return {
    aggregateId
  }
}

export const mapDispatchToProps = (dispatch, { aggregateActions }) =>
  bindActionCreators(
    {
      ...aggregateActions,
      replaceUrl: routerActions.replace
    },
    dispatch
  )

export default connectViewModel(mapStateToOptions)(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(ShoppingList)
)
```



# Optimistic Commands

With this approach, a component applies model changes before synchronizing them with the server via an aggregate command. After a command has been sent and the server has returned an OK response, data is synchronized between the client and server sides.
