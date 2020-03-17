import optimisticShoppingListsSaga from './sagas/optimistic_shopping_lists_saga'
import optimisticShoppingListsReducer from './reducers/optimistic_shopping_lists'

const getRedux = () => ({
  reducers: { optimisticShoppingLists: optimisticShoppingListsReducer },
  sagas: [optimisticShoppingListsSaga]
})

export default getRedux
