import optimisticShoppingListsSaga from './sagas/optimistic_shopping_lists_saga'
import optimisticShoppingListsReducer from './reducers/optimistic_shopping_lists'
import { devToolsEnhancer } from 'redux-devtools-extension'

const getRedux = () => ({
  reducers: { optimisticShoppingLists: optimisticShoppingListsReducer },
  sagas: [optimisticShoppingListsSaga],
  enhancers: [devToolsEnhancer()]
})

export default getRedux
