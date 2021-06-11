import { optimisticShoppingListsSaga } from './sagas/optimistic_shopping_lists_saga'
import { optimisticShoppingListsReducer } from './reducers/optimistic_shopping_lists'
import { reduxDevToolsEnhancer } from './enhancers/redux-devtools'
export const getRedux = () => ({
  reducers: {
    optimisticShoppingLists: optimisticShoppingListsReducer,
    jwt: (jwt = {}) => jwt,
  },
  sagas: [optimisticShoppingListsSaga],
  enhancers: [reduxDevToolsEnhancer],
})
